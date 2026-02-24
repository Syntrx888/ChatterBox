package com.syntrx.chatterbox;

import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.CapConfig;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "ChatterBox";
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        try {
            Log.d(TAG, "MainActivity onCreate started");
            
            getWindow().setFlags(
                WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
                WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS
            );
            
            getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            );
            
            Log.d(TAG, "Window flags set successfully");
            
            CapConfig config = getBridge().getConfig();
            Log.d(TAG, "Capacitor config loaded");
            Log.d(TAG, "App ID: " + config.getString("appId"));
            Log.d(TAG, "App Name: " + config.getString("appName"));
            Log.d(TAG, "Web Dir: " + config.getString("webDir"));
            
        } catch (Exception e) {
            Log.e(TAG, "Error in MainActivity onCreate", e);
            e.printStackTrace();
        }
    }
}
