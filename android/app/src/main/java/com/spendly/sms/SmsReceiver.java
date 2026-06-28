package com.spendly.sms;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
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
    for (Object pdu : pdus) {
      SmsMessage sms = SmsMessage.createFromPdu((byte[]) pdu, b.getString("format"));
      body.append(sms.getMessageBody());
      sender = sms.getOriginatingAddress();
      date = sms.getTimestampMillis();
    }
    Intent service = new Intent(context, SmsHeadlessTask.class);
    service.putExtra("sender", sender);
    service.putExtra("body", body.toString());
    service.putExtra("date", date);
    context.startService(service);
  }
}
