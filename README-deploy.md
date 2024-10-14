# Deploying App

have apple dev account ($99 per year)
need appleID and password

have expo account
username / password
eas
with RN, expo and eas (eas install global)
sign into expo and apple , open xcode and sign in

<!-- https://docs.expo.dev/submit/ios/ -->

```bash
eas-cli build --platform ios
```

```bash
eas-cli submit --platform ios
```

https://forums.developer.apple.com/forums/thread/98240
go with 5b)

5. I STRONGLY disagree that the preferred method of decoding the receipt is sending it to the Apple servers. Decoding on the device itself is the ONLY currently secure approach. Because the Apple servers do not check identifierForVendor there is no way of knowing that the receipt is really signed for the device. I have offered to explain this security issue to Apple but they have never responded. So here are the options:

A) Forget about fraud, rely on updatedTransactions. (Easiest but vulnerable to simple hacks.)

B) Send the receipt from the app directly to the Apple servers for decoding. Get back all the autorenewable info you could ever want. (Easy but subject to man-in-the-middle hacks.)

C) Send the receipt via a signed transmission (i.e. trusted and protected) to your server and then from your server to Apple for decoding. (Requires a server; allows your server to know independently whether the subscription is still active; difficult but not impossible to hack.)

D) Decode the receipt on the device. (Hard. Requires some security coding and OpenSSL but not impossible. Secure.)
