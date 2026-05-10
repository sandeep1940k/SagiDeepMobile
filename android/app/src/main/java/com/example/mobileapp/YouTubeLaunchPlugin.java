package com.example.mobileapp;

import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Opens the watch URL outside the WebView so Android can route it to the YouTube app
 * (WebView often ignores programmatic intent:// / custom-scheme links).
 */
@CapacitorPlugin(name = "YouTubeLaunch")
public class YouTubeLaunchPlugin extends Plugin {

    @PluginMethod
    public void openWatch(PluginCall call) {
        String videoId = call.getString("videoId");
        if (videoId == null || videoId.isEmpty()) {
            call.reject("videoId is required");
            return;
        }

        Uri uri = Uri.parse("https://www.youtube.com/watch?v=" + Uri.encode(videoId));
        Intent intent = new Intent(Intent.ACTION_VIEW, uri);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

        intent.setPackage("com.google.android.youtube");
        PackageManager pm = getContext().getPackageManager();
        if (intent.resolveActivity(pm) == null) {
            intent.setPackage(null);
        }

        try {
            getActivity().startActivity(intent);
            call.resolve();
        } catch (Exception e) {
            call.reject("Unable to open YouTube", e);
        }
    }
}
