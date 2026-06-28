package com.spendly.sms;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.telephony.SmsMessage;

public class SmsReceiver extends BroadcastReceiver {
  @Override
  public void onReceive(Context context, Intent intent) {
    Bundle b = intent.getExtras();
    if (b == null) return;
    Object[] pdus = (Object[]) b.get("pdus");
    if (pdus == null) return;
    StringBuilder body = new StringBuilder();
    String sender = "";
    long date = System.currentTimeMillis();
    boolean first = true;
    for (Object pdu : pdus) {
      SmsMessage sms = SmsMessage.createFromPdu((byte[]) pdu, b.getString("format"));
      body.append(sms.getMessageBody());
      if (first) {
        sender = sms.getOriginatingAddress();
        date = sms.getTimestampMillis();
        first = false;
      }
    }
    Intent service = new Intent(context, SmsHeadlessTask.class);
    service.putExtra("sender", sender);
    service.putExtra("body", body.toString());
    service.putExtra("date", date);
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      context.startForegroundService(service);
    } else {
      context.startService(service);
    }
  }
}
