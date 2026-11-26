package com.scpreader.app;

import android.graphics.Color;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.webkit.JavascriptInterface;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;
import java.util.Locale;

public class MainActivity extends BridgeActivity {
    private int mLastTop = 0;
    private int mLastBottom = 0;
    private int mLastLeft = 0;
    private int mLastRight = 0;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Window window = getWindow();
        // Enable Edge-to-Edge full screen layout
        WindowCompat.setDecorFitsSystemWindows(window, false);
        window.setStatusBarColor(Color.TRANSPARENT);
        window.setNavigationBarColor(Color.TRANSPARENT);

        // Expose synchronous safe-area query interface to WebView
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().addJavascriptInterface(new Object() {
                @JavascriptInterface
                public String getInsets() {
                    return String.format(Locale.ROOT, "{\"top\":%d,\"bottom\":%d,\"left\":%d,\"right\":%d}",
                        mLastTop, mLastBottom, mLastLeft, mLastRight);
                }
            }, "AndroidSafeArea");
        }

        // Listen for hardware notch, status bar, and 3-button / gesture navigation bar insets
        View decorView = window.getDecorView();
        ViewCompat.setOnApplyWindowInsetsListener(decorView, (v, windowInsets) -> {
            Insets insets = windowInsets.getInsets(
                WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout()
            );

            float density = getResources().getDisplayMetrics().density;
            mLastTop = (int) Math.ceil(insets.top / density);
            mLastBottom = (int) Math.ceil(insets.bottom / density);
            mLastLeft = (int) Math.ceil(insets.left / density);
            mLastRight = (int) Math.ceil(insets.right / density);

            applyInsetsToWebView();

            // Additional delayed sync to ensure WebView DOM is ready
            decorView.postDelayed(this::applyInsetsToWebView, 300);
            decorView.postDelayed(this::applyInsetsToWebView, 1000);

            return windowInsets;
        });
    }

    private void applyInsetsToWebView() {
        if (getBridge() != null && getBridge().getWebView() != null) {
            String js = String.format(Locale.ROOT,
                "(function() {" +
                "  document.documentElement.style.setProperty('--safe-area-inset-top', '%dpx');" +
                "  document.documentElement.style.setProperty('--safe-area-inset-bottom', '%dpx');" +
                "  document.documentElement.style.setProperty('--safe-area-inset-left', '%dpx');" +
                "  document.documentElement.style.setProperty('--safe-area-inset-right', '%dpx');" +
                "})();",
                mLastTop, mLastBottom, mLastLeft, mLastRight
            );
            getBridge().getWebView().post(() -> {
                getBridge().getWebView().evaluateJavascript(js, null);
            });
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        applyInsetsToWebView();
    }
}
