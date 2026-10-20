package dev.cihan.dexquest.complete;

import android.app.Activity;
import android.os.Bundle;
import android.graphics.Color;
import android.webkit.WebView;
import android.webkit.WebSettings;
import android.webkit.WebViewClient;
import android.webkit.WebResourceRequest;
import android.content.Intent;
import android.net.Uri;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.content.ActivityNotFoundException;
import java.io.InputStream;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;

public class MainActivity extends Activity {
 private WebView web;
 @Override public void onCreate(Bundle bundle) {
  super.onCreate(bundle);
  getWindow().setStatusBarColor(Color.rgb(11,18,32));
  getWindow().setNavigationBarColor(Color.rgb(11,18,32));
  web = new WebView(this);
  setContentView(web);
  WebSettings settings = web.getSettings();
  settings.setJavaScriptEnabled(true);
  settings.setDomStorageEnabled(true);
  settings.setAllowFileAccess(false);
  settings.setAllowContentAccess(false);
  settings.setJavaScriptCanOpenWindowsAutomatically(false);
  web.setWebViewClient(new WebViewClient() {
   @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
    Uri uri = request.getUrl();
    if ("https".equalsIgnoreCase(uri.getScheme()) && !"appassets.androidplatform.net".equalsIgnoreCase(uri.getHost())) {
     try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); } catch (ActivityNotFoundException ignored) {}
     return true;
    }
    return !"https".equalsIgnoreCase(uri.getScheme());
   }
  });
  try (InputStream input = getAssets().open("index.html")) {
   ByteArrayOutputStream bytes = new ByteArrayOutputStream();
   byte[] buffer = new byte[8192];
   int size;
   while ((size = input.read(buffer)) != -1) bytes.write(buffer, 0, size);
   web.loadDataWithBaseURL("https://appassets.androidplatform.net/", new String(bytes.toByteArray(), StandardCharsets.UTF_8),"text/html","UTF-8",null);
  } catch (Exception ignored) {}
 }
 @Override public void onBackPressed() {
  web.evaluateJavascript("window.dexBack ? window.dexBack() : false", result -> {
   if (!"true".equals(result)) MainActivity.super.onBackPressed();
  });
 }
 @Override protected void onDestroy() {
  web.destroy();
  super.onDestroy();
 }
}
