import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Modal, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { firebaseConfig } from '@/shared/services/firebase';

export type PhoneRecaptchaHandle = {
  /** Solve reCAPTCHA in a hidden web page and ask Firebase to send the SMS. Resolves to a verificationId. */
  requestVerificationId(phoneNumber: string): Promise<string>;
};

type Pending = { phone: string; resolve: (id: string) => void; reject: (error: Error) => void };

// Must match the Firebase web SDK major the compat scripts below are served for.
const SDK = 'https://www.gstatic.com/firebasejs/10.12.2';

const html = (phone: string) => `<!doctype html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1" />
<script src="${SDK}/firebase-app-compat.js"></script>
<script src="${SDK}/firebase-auth-compat.js"></script>
</head><body style="display:flex;justify-content:center;align-items:center;height:100vh;margin:0">
<div id="recaptcha"></div>
<script>
  const post = (m) => window.ReactNativeWebView.postMessage(JSON.stringify(m));
  try {
    firebase.initializeApp(${JSON.stringify(firebaseConfig)});
    const verifier = new firebase.auth.RecaptchaVerifier('recaptcha', { size: 'normal' });
    new firebase.auth.PhoneAuthProvider()
      .verifyPhoneNumber(${JSON.stringify(phone)}, verifier)
      .then((id) => post({ id }))
      .catch((e) => post({ error: e.message || String(e), code: e.code }));
  } catch (e) { post({ error: e.message || String(e) }); }
</script></body></html>`;

export const PhoneRecaptcha = forwardRef<PhoneRecaptchaHandle>(function PhoneRecaptcha(_, ref) {
  const pending = useRef<Pending | null>(null);
  const [phone, setPhone] = useState<string | null>(null);

  const finish = () => {
    pending.current = null;
    setPhone(null);
  };

  useImperativeHandle(ref, () => ({
    requestVerificationId: (phoneNumber) =>
      new Promise<string>((resolve, reject) => {
        pending.current = { phone: phoneNumber, resolve, reject };
        setPhone(phoneNumber);
      }),
  }));

  const onMessage = (event: WebViewMessageEvent) => {
    const p = pending.current;
    if (!p) return;
    const data = JSON.parse(event.nativeEvent.data) as { id?: string; error?: string; code?: string };
    if (data.id) p.resolve(data.id);
    else p.reject(Object.assign(new Error(data.error ?? 'Verification failed'), { code: data.code }));
    finish();
  };

  const cancel = () => {
    pending.current?.reject(new Error('Verification was cancelled.'));
    finish();
  };

  return (
    <Modal visible={phone !== null} animationType="slide" onRequestClose={cancel}>
      <View style={{ flex: 1 }}>
        {phone !== null ? (
          <WebView
            // The page must be served from an authorized domain for reCAPTCHA to accept it.
            source={{ html: html(phone), baseUrl: `https://${firebaseConfig.authDomain}` }}
            onMessage={onMessage}
            javaScriptEnabled
          />
        ) : null}
      </View>
    </Modal>
  );
});
