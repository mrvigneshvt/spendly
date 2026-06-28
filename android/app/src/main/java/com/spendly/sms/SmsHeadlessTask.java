package com.spendly.sms;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;
import com.facebook.react.HeadlessJsTaskService;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.jstasks.HeadlessJsTaskConfig;
import android.content.Context;

public class SmsHeadlessTask extends HeadlessJsTaskService {
  private static final String CHANNEL_ID = "spendly_sms";
  private static final int NOTIFICATION_ID = 9001;

  @Override
  public void onCreate() {
    super.onCreate();
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      NotificationChannel ch = new NotificationChannel(CHANNEL_ID, "SMS Monitoring",
          NotificationManager.IMPORTANCE_LOW);
      NotificationManager nm = getSystemService(NotificationManager.class);
      nm.createNotificationChannel(ch);
    }
  }

  @Override
  public int onStartCommand(Intent intent, int flags, int startId) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
          .setContentTitle("Spendly")
          .setContentText("Monitoring SMS transactions")
          .setSmallIcon(android.R.drawable.ic_dialog_info)
          .setOngoing(true)
          .build();
      startForeground(NOTIFICATION_ID, notification);
    }
    return super.onStartCommand(intent, flags, startId);
  }

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
