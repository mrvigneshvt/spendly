// Jest mock for @op-engineering/op-sqlite
// Plain JS — provides a minimal in-memory SQLite-like interface for testing

var _seq = 0;

function MockDB() {
  this.tables = {};
  this._seq = 0;
}

MockDB.prototype._evalWhere = function(row, clause, params) {
  if (!clause) return true;
  var paramIdx = 0;
  var results = [];
  // Split on AND but protect BETWEEN x AND y by replacing the AND in BETWEEN with a sentinel
  var clauseProtected = clause.replace(/BETWEEN\s+\?\s+AND\s+\?/g, function(m) {
    return m.replace(' AND ', ' ___AND___ ');
  });
  var parts = clauseProtected.split(/\s+AND\s+/i);
  for (var pi = 0; pi < parts.length; pi++) {
    var part = parts[pi].trim().replace(/\s*___AND___\s*/g, ' AND ');

    // BETWEEN ? AND ?
    var betweenMatch = part.match(/(\w+)\s+BETWEEN\s+\?\s+AND\s+\?/i);
    if (betweenMatch) {
      var col = betweenMatch[1];
      var low = params[paramIdx++];
      var high = params[paramIdx++];
      results.push(row[col] >= low && row[col] <= high);
      continue;
    }

    // IS NOT NULL
    if (/IS NOT NULL/i.test(part)) {
      var colMatch = part.match(/(\w+)\s+IS NOT NULL/i);
      results.push(colMatch ? row[colMatch[1]] != null : true);
      continue;
    }

    // IS NULL
    if (/IS NULL/i.test(part)) {
      var colMatch = part.match(/(\w+)\s+IS NULL/i);
      results.push(colMatch ? row[colMatch[1]] == null : true);
      continue;
    }

    // col=?
    var eqMatch = part.match(/(\w+)\s*=\s*\?/);
    if (eqMatch) {
      var col = eqMatch[1];
      var val = params[paramIdx++];
      results.push(row[col] === val);
      continue;
    }

    results.push(true);
  }
  return results.every(function(r) { return r; });
};

MockDB.prototype.execute = function(sql, params) {
  params = params || [];

  // --- DDL: CREATE TABLE / INDEX ---
  if (/CREATE TABLE/i.test(sql)) {
    var createMatch = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/i);
    if (createMatch) {
      var tableName = createMatch[1];
      if (!this.tables[tableName]) this.tables[tableName] = [];
    }
    return { rows: { _array: [] } };
  }

  if (/CREATE (UNIQUE )?INDEX/i.test(sql)) {
    return { rows: { _array: [] } };
  }

  // --- INSERT ---
  var insertMatch = sql.match(/INSERT INTO (\w+)/i);
  if (insertMatch) {
    var tableName = insertMatch[1];
    var colsMatch = sql.match(/\(([^)]+)\)\s*VALUES/i);
    if (colsMatch) {
      var cols = colsMatch[1].split(',').map(function(c) { return c.trim(); });
      if (!this.tables[tableName]) this.tables[tableName] = [];
      var row = {};
      cols.forEach(function(col, i) {
        row[col] = params[i] !== undefined ? params[i] : null;
      });
      this.tables[tableName].push(row);
    }
    return { rows: { _array: [] } };
  }

  // --- UPDATE ---
  var updateMatch = sql.match(/UPDATE\s+(\w+)/i);
  if (updateMatch) {
    var tableName = updateMatch[1];
    var setMatch = sql.match(/SET\s+(.+?)(?:\s+WHERE|\s*$)/i);
    var whereMatch = sql.match(/WHERE\s+(.+)/i);
    var table = this.tables[tableName] || [];
    var self = this;

    // Parse SET assignments: col1=?, col2=?
    var setClause = setMatch ? setMatch[1] : '';
    var setParts = setClause.split(',').map(function(s) { return s.trim(); });
    var setCols = [];
    var paramIdx = 0;
    setParts.forEach(function(part) {
      var m = part.match(/(\w+)\s*=\s*\?/);
      if (m) { setCols.push({ col: m[1], paramIdx: paramIdx++ }); }
    });

    // Determine which params belong to WHERE
    var whereParamIdx = paramIdx;

    var filtered = whereMatch
      ? table.filter(function(row) {
          var whereParams = params.slice(whereParamIdx);
          return self._evalWhere(row, whereMatch[1], whereParams);
        })
      : table;

    filtered.forEach(function(row) {
      setCols.forEach(function(sc) {
        row[sc.col] = params[sc.paramIdx];
      });
    });

    return { rows: { _array: [] } };
  }

  // --- DELETE ---
  var deleteMatch = sql.match(/DELETE\s+FROM\s+(\w+)/i);
  if (deleteMatch) {
    var tableName = deleteMatch[1];
    var whereMatch = sql.match(/WHERE\s+(.+)/i);
    var table = this.tables[tableName] || [];
    var self = this;

    if (whereMatch) {
      this.tables[tableName] = table.filter(function(row) {
        return !self._evalWhere(row, whereMatch[1], params);
      });
    } else {
      this.tables[tableName] = [];
    }
    return { rows: { _array: [] } };
  }

  // --- SELECT ---
  var selectMatch = sql.match(/SELECT\s+(.+?)\s+FROM\s+(\w+)/i);
  if (selectMatch) {
    var selectClause = selectMatch[1].trim();
    var tableName = selectMatch[2];
    var rows = this.tables[tableName] || [];
    var filtered = rows.slice();
    var self = this;

    // WHERE
    var whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+ORDER\s+BY|\s+GROUP\s+BY|\s*$)/i);
    if (whereMatch) {
      filtered = filtered.filter(function(row) {
        return self._evalWhere(row, whereMatch[1], params);
      });
    }

    // GROUP BY
    var groupByMatch = sql.match(/GROUP\s+BY\s+(\w+)/i);

    // ORDER BY
    var orderMatch = sql.match(/ORDER\s+BY\s+(.+?)(?:\s+(ASC|DESC))?(?:\s+LIMIT|\s*$)/i);
    if (orderMatch) {
      var orderCol = orderMatch[1].trim();
      var orderDir = (orderMatch[2] || 'ASC').toUpperCase();
      filtered.sort(function(a, b) {
        var va = a[orderCol], vb = b[orderCol];
        if (va == null) va = ''; if (vb == null) vb = '';
        var cmp = va > vb ? 1 : va < vb ? -1 : 0;
        return orderDir === 'DESC' ? -cmp : cmp;
      });
    }

    // LIMIT
    var limitMatch = sql.match(/LIMIT\s+(\d+)/i);
    if (limitMatch) filtered = filtered.slice(0, parseInt(limitMatch[1]));

    // Parse select expressions
    var isAggregate = /\b(COUNT|SUM)\s*\(/i.test(selectClause);
    var selectExprs = selectClause.split(',').map(function(e) {
      e = e.trim();
      var alias;
      var asMatch = e.match(/\s+AS\s+(\w+)/i);
      if (asMatch) {
        alias = asMatch[1];
        e = e.replace(/\s+AS\s+\w+/i, '');
      } else if (/\b(COUNT|SUM)\s*\(/i.test(e)) {
        // Check if there's an implicit alias (whitespace before alias)
        var implicit = e.match(/\)\s+(\w+)$/i);
        if (implicit) {
          alias = implicit[1];
        } else {
          alias = e.match(/\)$/i) ? (/\bCOUNT/i.test(e) ? 'c' : 't') : e.replace(/^\w+\./, '');
        }
      } else {
        // Simple column reference — use as is
        alias = e.replace(/^\w+\.(\w+)$/, '$1');
      }
      return { expr: e, alias: alias };
    });

    // Handle aggregation
    if (isAggregate) {
      var result;
      if (groupByMatch) {
        var groupCol = groupByMatch[1];
        var groups = {};
        filtered.forEach(function(r) {
          var key = r[groupCol] !== undefined ? r[groupCol] : null;
          if (!groups[key]) groups[key] = [];
          groups[key].push(r);
        });
        result = Object.keys(groups).map(function(k) {
          var grp = groups[k];
          var o = {};
          o[groupCol] = k;
          selectExprs.forEach(function(se) {
            if (/\bCOUNT\s*\(/i.test(se.expr)) o[se.alias] = grp.length;
            else if (/\bSUM\s*\(/i.test(se.expr)) {
              var colMatch = se.expr.match(/SUM\s*\(\s*(\w+)\s*\)/i);
              o[se.alias] = grp.reduce(function(s, r) { return s + (r[colMatch[1]] || 0); }, 0);
            }
          });
          return o;
        });
      } else {
        result = [{}];
        selectExprs.forEach(function(se) {
          if (/\bCOUNT\s*\(/i.test(se.expr)) result[0][se.alias] = filtered.length;
          else if (/\bSUM\s*\(/i.test(se.expr)) {
            var colMatch = se.expr.match(/SUM\s*\(\s*(\w+)\s*\)/i);
            result[0][se.alias] = filtered.reduce(function(s, r) { return s + (r[colMatch[1]] || 0); }, 0);
          }
        });
      }
      return { rows: { _array: result } };
    }

    // Non-aggregate SELECT
    if (selectClause === '*') {
      return { rows: { _array: filtered.map(function(r) { return Object.assign({}, r); }) } };
    }
    var mapped = filtered.map(function(r) {
      var o = {};
      selectExprs.forEach(function(se) {
        o[se.alias] = r[se.expr.replace(/^\w+\.(\w+)$/, '$1')] !== undefined
          ? r[se.expr.replace(/^\w+\.(\w+)$/, '$1')]
          : null;
      });
      return o;
    });
    return { rows: { _array: mapped } };
  }

  return { rows: { _array: [] } };
};

MockDB.prototype.close = function() {
  this.tables = {};
};

function open(config) {
  return new MockDB();
}

module.exports = { open: open };
