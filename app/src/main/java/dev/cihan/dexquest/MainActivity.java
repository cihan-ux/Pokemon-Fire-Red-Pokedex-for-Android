package dev.cihan.dexquest;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import java.io.InputStream;
import java.io.ByteArrayOutputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

/** Minimal, independent Android shell for the first-party, bundled DexQuest HTML UI. */
public class MainActivity extends Activity {
    private static final int PICK_JSON = 1001;
    private static final int SAVE_JSON = 1002;
    private static final String APP_ORIGIN = "https://appassets.androidplatform.net/";
    private WebView web;
    private ValueCallback<Uri[]> fileChooser;
    private String pendingJson;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(Color.rgb(9, 17, 32));
        getWindow().setNavigationBarColor(Color.rgb(9, 17, 32));
        web = new WebView(this);
        web.setBackgroundColor(Color.rgb(9, 17, 32));
        setContentView(web);
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true); // Bundled first-party HTML requires JS.
        settings.setDomStorageEnabled(true); // Offline checkmarks are stored locally.
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setSupportMultipleWindows(false);
        web.addJavascriptInterface(new Bridge(), "AndroidBridge");
        web.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest request) {
                return handleNavigation(request.getUrl());
            }
            @Override public boolean shouldOverrideUrlLoading(WebView v, String url) {
                return handleNavigation(Uri.parse(url));
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> callback,
                                                       FileChooserParams params) {
                if (fileChooser != null) fileChooser.onReceiveValue(null);
                fileChooser = callback;
                Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                intent.setType("*/*");
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                try { startActivityForResult(intent, PICK_JSON); }
                catch (ActivityNotFoundException ex) {
                    fileChooser = null;
                    callback.onReceiveValue(null);
                    return false;
                }
                return true;
            }
        });
        try (InputStream is = getAssets().open("index.html")) {
            ByteArrayOutputStream output = new ByteArrayOutputStream();
            byte[] chunk = new byte[8192];
            int n;
            while ((n = is.read(chunk)) != -1) output.write(chunk, 0, n);
            web.loadDataWithBaseURL(APP_ORIGIN,
                new String(output.toByteArray(), StandardCharsets.UTF_8),
                "text/html", "UTF-8", null);
        } catch (Exception e) {
            Toast.makeText(this, "Could not load DexQuest", Toast.LENGTH_LONG).show();
        }
    }

    private boolean handleNavigation(Uri url) {
        if ("https".equalsIgnoreCase(url.getScheme()) &&
            "appassets.androidplatform.net".equalsIgnoreCase(url.getHost())) return false;
        if ("https".equalsIgnoreCase(url.getScheme())) openExternal(url.toString());
        return true;
    }

    private void openExternal(String href) {
        Uri uri = Uri.parse(href);
        if (!"https".equalsIgnoreCase(uri.getScheme()) || uri.getHost() == null) return;
        runOnUiThread(() -> {
            try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); }
            catch (ActivityNotFoundException ignored) {
                Toast.makeText(this, "No browser available", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private final class Bridge {
        @JavascriptInterface public void saveJson(String name, String json) {
            if (json == null || json.length() > 2_000_000) return;
            runOnUiThread(() -> {
                pendingJson = json;
                Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("application/json");
                intent.putExtra(Intent.EXTRA_TITLE, "dexquest-firered-progress.json");
                try { startActivityForResult(intent, SAVE_JSON); }
                catch (ActivityNotFoundException ignored) { pendingJson = null; }
            });
        }
        @JavascriptInterface public void openExternal(String href) {
            MainActivity.this.openExternal(href);
        }
    }

    @Override protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == PICK_JSON) {
            if (fileChooser != null) {
                fileChooser.onReceiveValue(resultCode == RESULT_OK && data != null && data.getData() != null
                    ? new Uri[]{data.getData()} : null);
                fileChooser = null;
            }
        } else if (requestCode == SAVE_JSON) {
            if (resultCode == RESULT_OK && data != null && data.getData() != null && pendingJson != null) {
                try (OutputStream out = getContentResolver().openOutputStream(data.getData())) {
                    if (out != null) {
                        out.write(pendingJson.getBytes(StandardCharsets.UTF_8));
                        Toast.makeText(this, "Progress exported", Toast.LENGTH_SHORT).show();
                    }
                } catch (Exception e) {
                    Toast.makeText(this, "Could not save JSON file", Toast.LENGTH_LONG).show();
                }
            }
            pendingJson = null;
        }
    }

    @Override public void onBackPressed() {
        web.evaluateJavascript("(function(){if(document.getElementById('overlay').classList.contains('open')){closeDetail();return 'handled';}if(!document.getElementById('page-collection').classList.contains('active')){page('collection');return 'handled';}return 'exit';})()", value -> {
            if (!"\"handled\"".equals(value)) MainActivity.super.onBackPressed();
        });
    }

    @Override protected void onDestroy() {
        if (fileChooser != null) { fileChooser.onReceiveValue(null); fileChooser = null; }
        if (web != null) { web.removeJavascriptInterface("AndroidBridge"); web.destroy(); }
        super.onDestroy();
    }
}
