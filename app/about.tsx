import { useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { WebView } from "react-native-webview";
import { Button, Icon, Notice, T } from "@/components/ui";
import { useAbout } from "@/hooks/useBank";
import { colors } from "@/theme";

const ALLOWED_HOST = "https://www.bfa.ao/";

/** Hides the website's own header, menus, search and footer so the page reads as part of the app. */
const HIDE_CHROME = `
(function () {
  var css = 'header,footer,nav,.footer,.nav,.menu-top,.menu-top-main,.menu-top-mobile,.navigation-mobile,.navbar,.panel,.js-mobilePanel,.flyover,.bg-overlay,.bg-menutop-overlay,.ctn-search{display:none!important}' +
            'html,body{margin:0!important;padding-top:0!important;background:#fff!important}';
  var s = document.createElement('style'); s.textContent = css;
  (document.head || document.documentElement).appendChild(s);
})(); true;`;

export default function AboutScreen() {
  const about = useAbout();
  const ref = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  if (about.isPending) return <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}><ActivityIndicator color={colors.brand} /></View>;
  const url = about.data?.url;
  // Never load anything the API returns unless it is on the bank's own site over HTTPS.
  if (about.isError || !url || !url.startsWith(ALLOWED_HOST)) return <View style={{ padding: 16 }}><Notice kind="error">Informação indisponível de momento.</Notice></View>;

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {failed ? (
        <View style={{ padding: 24, gap: 12, alignItems: "center" }}>
          <Icon name="cloud-offline-outline" size={40} color={colors.muted} />
          <T style={{ textAlign: "center" }}>Não foi possível carregar a página.</T>
          <Button title="Tentar novamente" onPress={() => { setFailed(false); setLoading(true); ref.current?.reload(); }} />
        </View>
      ) : (
        <WebView
          ref={ref} source={{ uri: url }} style={{ flex: 1 }}
          injectedJavaScriptBeforeContentLoaded={HIDE_CHROME}
          originWhitelist={["https://www.bfa.ao"]}
          onShouldStartLoadWithRequest={(req) => req.url.startsWith(ALLOWED_HOST)} // no navigating away from bfa.ao
          setSupportMultipleWindows={false} incognito thirdPartyCookiesEnabled={false} sharedCookiesEnabled={false}
          allowFileAccess={false} mixedContentMode="never" domStorageEnabled={false} allowsBackForwardNavigationGestures
          onLoadEnd={() => setLoading(false)} onError={() => { setFailed(true); setLoading(false); }} onHttpError={() => { setFailed(true); setLoading(false); }}
        />
      )}
      {loading && !failed ? <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" }}><ActivityIndicator color={colors.brand} size="large" /></View> : null}
    </View>
  );
}
