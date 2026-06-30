package com.spendly.smsreader;

import android.database.Cursor;
import android.net.Uri;
import android.provider.Telephony;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;

public class SmsReaderModule extends ReactContextBaseJavaModule {

    private final ReactApplicationContext reactContext;

    public SmsReaderModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return "SmsReader";
    }

    @ReactMethod
    public void list(String filterJson, Promise promise) {
        try {
            Uri uri = Telephony.Sms.Inbox.CONTENT_URI;
            String[] projection = new String[]{
                Telephony.Sms.ADDRESS,
                Telephony.Sms.BODY,
                Telephony.Sms.DATE
            };
            String sortOrder = Telephony.Sms.DATE + " DESC";
            int maxCount = 2000; // default

            Cursor cursor = reactContext.getContentResolver().query(
                uri, projection, null, null, sortOrder);

            WritableArray results = Arguments.createArray();
            if (cursor != null) {
                int count = 0;
                while (cursor.moveToNext() && count < maxCount) {
                    WritableMap msg = Arguments.createMap();
                    msg.putString("address", cursor.getString(cursor.getColumnIndexOrThrow(Telephony.Sms.ADDRESS)));
                    msg.putString("body", cursor.getString(cursor.getColumnIndexOrThrow(Telephony.Sms.BODY)));
                    msg.putDouble("date", cursor.getLong(cursor.getColumnIndexOrThrow(Telephony.Sms.DATE)));
                    results.pushMap(msg);
                    count++;
                }
                cursor.close();
            }

            promise.resolve(results);
        } catch (Exception e) {
            promise.reject("SMS_READ_ERROR", e.getMessage(), e);
        }
    }
}
