package com.spendly.sms;

import android.content.Intent;
import android.os.Bundle;
import androidx.annotation.Nullable;
import com.facebook.react.HeadlessJsTaskService;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.jstasks.HeadlessJsTaskConfig;
import android.content.Context;

public class SmsHeadlessTask extends HeadlessJsTaskService {
  @Nullable
  @Override
  protected HeadlessJsTaskConfig getTaskConfig(Intent intent) {
    Bundle extras = intent.getExtras();
    if (extras == null) return null;
    WritableMap data = Arguments.createMap();
    data.putString("sender", extras.getString("sender"));
    data.putString("body", extras.getString("body"));
    data.putDouble("date", extras.getLong("date"));
    return new HeadlessJsTaskConfig("SpendlySmsTask", data, 30000, true);
  }
}
