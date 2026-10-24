package com.dexquest.go;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.graphics.Color;
import android.graphics.Insets;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.WindowInsets;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

/**
 * Thin native shell around local, packaged DexQuest GO HTML/CSS/JS.
 * The bridge is only attached to the app's own HTML; external URLs never load in the WebView.
 */
public final class MainActivity extends Activity {
    private static final String ORIGIN = "appassets.androidplatform.net";
    private static final String HOME = "https://" + ORIGIN + "/assets/index.html";
    private static final int REQUEST_IMPORT = 301;
    private static final int REQUEST_EXPORT = 302;
    private static final int MAX_BACKUP_BYTES = 1024 * 1024;
    private static final Map<String, String> PACKAGED_ASSETS = new HashMap<>();

    static {
        PACKAGED_ASSETS.put("index.html", "text/html");
        PACKAGED_ASSETS.put("styles.css", "text/css");
        PACKAGED_ASSETS.put("app.js", "text/javascript");
        PACKAGED_ASSETS.put("species.js", "text/javascript");
    }

    private WebView webView;
    private ValueCallback<Uri[]> importCallback;
    private String exportBody;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(Color.rgb(9, 19, 32));
        getWindow().setNavigationBarColor(Color.rgb(11, 26, 43));
        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.rgb(9, 19, 32));
        if (Build.VERSION.SDK_INT >= 30) {
            root.setOnApplyWindowInsetsListener((view, insets) -> {
                Insets bars = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout());
                view.setPadding(bars.left, bars.top, bars.right, bars.bottom);
                return insets;
            });
        } else {
            root.setFitsSystemWindows(true);
        }

        webView = new WebView(this);
        webView.setBackgroundColor(Color.rgb(9, 19, 32));
        root.addView(webView, new FrameLayout.LayoutParams(-1,-1));
        setContentView(root);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);       // Packaged application scripts only (CSP).
        settings.setDomStorageEnabled(true);       // Persistent on-device Pokédex state.
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true);      // User-selected content:// JSON files.
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setSupportMultipleWindows(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        if ((getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0) {
            WebView.setWebContentsDebuggingEnabled(true);
        }

        webView.addJavascriptInterface(new AndroidBridge(), "AndroidDexQuest");
        webView.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (!ORIGIN.equals(uri.getHost())) return null;
                if (!"https".equalsIgnoreCase(uri.getScheme())) return error404();
                String path=uri.getPath();
                if (path == null || !path.startsWith("/assets/")) return error404();
                String filename=path.substring("/assets/".length());
                String type=PACKAGED_ASSETS.get(filename);
                if (type == null) return error404();
                try {
                    InputStream source=getAssets().open(filename);
                    WebResourceResponse response=new WebResourceResponse(type,"UTF-8",source);
                    response.setResponseHeaders(Collections.singletonMap("Cache-Control","no-store"));
                    return response;
                } catch (IOException exception) { return error404(); }
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri=request.getUrl();
                if (HOME.equals(uri.toString())) return false;
                openInBrowser(uri);
                return true;
            }
        });
        webView.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView view,
                    ValueCallback<Uri[]> callback, FileChooserParams params) {
                if(importCallback != null) importCallback.onReceiveValue(null);
                importCallback=callback;
                Intent pick = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                pick.addCategory(Intent.CATEGORY_OPENABLE);
                pick.setType("*/*"); // Some providers identify .json as application/octet-stream.
                try { startActivityForResult(pick, REQUEST_IMPORT); }
                catch(ActivityNotFoundException exception) {
                    importCallback.onReceiveValue(null);
                    importCallback=null;
                    Toast.makeText(MainActivity.this,"File picker unavailable",Toast.LENGTH_SHORT).show();
                }
                return true;
            }
        });
        webView.loadUrl(HOME);
    }

    private WebResourceResponse error404() {
        return new WebResourceResponse("text/plain","UTF-8",404,"Not Found",
                Collections.singletonMap("Cache-Control","no-store"),
                new ByteArrayInputStream(new byte[0]));
    }
    private void openInBrowser(Uri uri) {
        if (!"https".equalsIgnoreCase(uri.getScheme()) && !"http".equalsIgnoreCase(uri.getScheme())) return;
        try { startActivity(new Intent(Intent.ACTION_VIEW,uri)); }
        catch(ActivityNotFoundException exception) {
            Toast.makeText(this,"Browser unavailable",Toast.LENGTH_SHORT).show();
        }
    }
    public final class AndroidBridge {
        @JavascriptInterface public void copyText(String value) {
            if(value == null || value.length()>8192) return;
            runOnUiThread(() -> {
                ClipboardManager clipboard=(ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
                clipboard.setPrimaryClip(ClipData.newPlainText("Pokémon GO search",value));
            });
        }
        @JavascriptInterface public void shareText(String value) {
            if(value == null || value.length()>8192) return;
            runOnUiThread(() -> {
                Intent share=new Intent(Intent.ACTION_SEND);
                share.setType("text/plain");share.putExtra(Intent.EXTRA_TEXT,value);
                startActivity(Intent.createChooser(share,"Share Pokémon GO search"));
            });
        }
        @JavascriptInterface public void exportJson(String filename, String body) {
            if(body==null || body.getBytes(StandardCharsets.UTF_8).length>MAX_BACKUP_BYTES) return;
            try {
                JSONObject data=new JSONObject(body);
                if(!"DexQuestGO".equals(data.optString("app")) || data.optInt("version")!=1) return;
                JSONArray caught=data.optJSONArray("caught"),shiny=data.optJSONArray("shiny"),goals=data.optJSONArray("goals");
                if(caught==null || shiny==null || goals==null || caught.length()>1025 || shiny.length()>1025 || goals.length()>250) return;
                for(JSONArray ids:new JSONArray[]{caught,shiny}) for(int i=0;i<ids.length();i++) {
                    int id=ids.getInt(i);if(id<1 || id>1025)return;
                }
            } catch(Exception ignored) { return; }
            final String safeName=filename!=null && filename.matches("[A-Za-z0-9._-]{1,64}\\.json") ? filename : "dexquest-go-backup.json";
            runOnUiThread(() -> {
                exportBody=body;
                Intent create=new Intent(Intent.ACTION_CREATE_DOCUMENT);
                create.addCategory(Intent.CATEGORY_OPENABLE);
                create.setType("application/json");
                create.putExtra(Intent.EXTRA_TITLE,safeName);
                try {startActivityForResult(create, REQUEST_EXPORT);}
                catch(ActivityNotFoundException exception) {
                    exportBody=null;
                    Toast.makeText(MainActivity.this,"Document saver unavailable",Toast.LENGTH_SHORT).show();
                }
            });
        }
    }
    @Override protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode,resultCode,data);
        if(requestCode==REQUEST_IMPORT) {
            if(importCallback!=null) {
                importCallback.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(resultCode,data));
                importCallback=null;
            }
        } else if(requestCode==REQUEST_EXPORT) {
            String body=exportBody;exportBody=null;
            if(resultCode==RESULT_OK && data!=null && data.getData()!=null && body!=null) {
                try(OutputStream output=getContentResolver().openOutputStream(data.getData())) {
                    if(output==null)throw new IOException("No output stream");
                    output.write(body.getBytes(StandardCharsets.UTF_8));
                    Toast.makeText(this,"DexQuest GO backup saved",Toast.LENGTH_SHORT).show();
                } catch(IOException exception) {
                    Toast.makeText(this,"Unable to save backup",Toast.LENGTH_LONG).show();
                }
            }
        }
    }
    @Override public void onBackPressed() {
        if(webView==null) {super.onBackPressed();return;}
        webView.evaluateJavascript("window.dexquestGoBack ? window.dexquestGoBack() : false", result -> {
            if(!"true".equals(result)) MainActivity.super.onBackPressed();
        });
    }
    @Override protected void onDestroy() {
        if(importCallback!=null) {importCallback.onReceiveValue(null);importCallback=null;}
        if(webView!=null) {
            webView.removeJavascriptInterface("AndroidDexQuest");
            webView.destroy();webView=null;
        }
        super.onDestroy();
    }
}