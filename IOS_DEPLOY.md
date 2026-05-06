# Déploiement iOS — Celio App Store

Guide pour publier l'app Celio sur l'App Store iOS. Le scaffolding Capacitor est déjà fait dans le repo (`ios/App/App.xcworkspace`, `capacitor.config.ts`, `client/src/lib/apiBase.ts`). Ce document couvre **uniquement** les étapes de build, signature et soumission qui exigent un Mac.

---

## Prérequis

- **Mac avec macOS 14+** (physique, MacInCloud, Codemagic, ou GitHub Actions runner `macos-latest`)
- **Xcode 15+** depuis le Mac App Store
- **CocoaPods** : `sudo gem install cocoapods`
- **Compte Apple Developer** actif (99 €/an) — vérifier sur [developer.apple.com/account](https://developer.apple.com/account)
- **Node 20+** et **npm**

---

## 1. Cloner et builder

Sur le Mac :

```bash
git clone <repo-url> celio
cd celio
npm install
npm run app:ios
```

`npm run app:ios` enchaîne `vite build` → `cap sync ios` → `cap open ios`. Xcode s'ouvre sur `App.xcworkspace`.

> Si CocoaPods rouspète sur les versions, dans `ios/App/` : `pod install --repo-update`.

---

## 2. Configurer le Bundle ID sur developer.apple.com

Avant la signature dans Xcode, le Bundle ID `it.celiopromo.app` doit être enregistré :

1. [developer.apple.com](https://developer.apple.com/account/resources/identifiers/list) → **Identifiers** → **+**
2. **App IDs** → **App** → Continue
3. Description : `Celio iOS App`, Bundle ID : `it.celiopromo.app` (Explicit)
4. Capabilities : ne rien cocher pour la v1 (pas de push, pas d'IAP). Continue → Register

---

## 3. Signature dans Xcode

Dans Xcode, projet `App` ouvert :

1. Sélectionner la cible **App** dans le navigateur
2. Onglet **Signing & Capabilities**
3. Cocher **Automatically manage signing**
4. **Team** : choisir ton équipe Apple Developer
5. **Bundle Identifier** : `it.celiopromo.app` (déjà rempli)
6. Onglet **General** :
   - **Display Name** : `Celio`
   - **Version** : `1.0.0`
   - **Build** : `1`
   - **Minimum Deployments** : `iOS 14.0` (ou plus)
   - **iPhone Orientations** : Portrait seulement (cocher décocher Landscape Left/Right)
   - **iPad** : décocher si app iPhone-only

---

## 4. Permissions Info.plist

Ouvrir `ios/App/App/Info.plist` (clic droit → Open As → Source Code) et vérifier que ces clés existent. Si elles manquent, les ajouter :

```xml
<key>NSCameraUsageDescription</key>
<string>Celio utilizza la fotocamera per la prova virtuale degli abiti.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>Celio accede alle tue foto per provare virtualmente gli abiti.</string>
```

> Sans ces clés, l'upload App Store sera **rejeté** si le code appelle `<input type="file" accept="image/*">` sur la page try-on.

---

## 5. Test sur device réel

Avant Archive, tester sur un iPhone branché :

1. Brancher l'iPhone, faire confiance au Mac
2. Dans Xcode, sélectionner le device en haut (à côté du nom du scheme)
3. **Cmd+R** pour build & run
4. Tester :
   - Navigation catégories (`/category/maglioni`)
   - Détail produit + carrousel d'images
   - Login client (localStorage)
   - Ajout au panier
   - **Try-on** (caméra + upload) — endpoint `/api/virtual-tryon`
5. Ouvrir la console Safari (Mac → Develop → [iPhone] → App) pour voir les logs réseau et confirmer que les `fetch('/api/...')` partent bien vers `https://celiopromo.it`

---

## 6. Archive et upload

1. Dans Xcode, choisir le device cible **Any iOS Device (arm64)** (en haut)
2. Menu **Product → Archive**
3. L'**Organizer** s'ouvre quand l'archive est prête (~2-5 min)
4. Sélectionner l'archive → **Distribute App**
5. **App Store Connect** → Next
6. **Upload** → Next
7. Laisser cocher : Strip Swift symbols, Upload symbols, Manage Version and Build Number
8. **Automatically manage signing** → Next
9. Vérifier le résumé → **Upload**

L'upload prend 5-15 min. Tu reçois un email "build received" puis "build processed" (~30-60 min de processing côté Apple).

---

## 7. Fiche App Store Connect

Sur [appstoreconnect.apple.com](https://appstoreconnect.apple.com) → **My Apps** → **+ → New App** :

- **Platform** : iOS
- **Name** : `Celio` (visible dans l'App Store)
- **Primary Language** : Italian
- **Bundle ID** : `it.celiopromo.app` (sélectionner dans la liste)
- **SKU** : `celio-ios-001`
- **User Access** : Full Access

Une fois l'app créée, remplir l'onglet **App Information** :
- **Subtitle** : ex `Moda uomo - Celio Italia`
- **Category** : Primary `Shopping`, Secondary `Lifestyle`
- **Content Rights** : "Does not contain third-party content" si tout est ton catalogue

### Onglet **Pricing and Availability**
- **Price** : Free
- **Availability** : Italy (ou plus large selon ton marché)

### Onglet **App Privacy** (obligatoire)

Apple bloque la soumission sans ça. Déclarer :

- **Contact Info** : Email (associé au compte client lors de l'inscription)
  - Linked to user, not used for tracking
- **User Content** : Photos (si try-on stocke les images)
  - Linked to user, not used for tracking
- **Identifiers** : User ID (si tu génères des IDs internes)
  - Linked to user, not used for tracking

**URL Privacy Policy** obligatoire. Si tu n'en as pas, créer une page `https://celiopromo.it/privacy` (page web statique suffit).

### Onglet **Version 1.0** (la fiche store)

- **Promotional Text** (170 chars) : ex `Scopri la nuova collezione Celio. Prova virtuale degli abiti direttamente dal tuo iPhone.`
- **Description** (4000 chars) : description complète en italien
- **Keywords** (100 chars, virgule-séparés) : ex `celio,moda,uomo,abbigliamento,camicie,jeans,polo,maglioni`
- **Support URL** : `https://celiopromo.it/support` (ou page contact)
- **Marketing URL** : `https://celiopromo.it` (optionnel)

### Screenshots (obligatoires)

Tailles minimum requises :
- **iPhone 6.9"** (15/16 Pro Max) : 1290 × 2796 — **3 minimum**
- **iPhone 6.5"** (XS Max, 11 Pro Max) : 1242 × 2688 — **3 minimum**

Capturer depuis Xcode Simulator (iPhone 15 Pro Max + iPhone 11 Pro Max) :
- Homepage
- Liste catégorie
- Détail produit
- Try-on
- Panier ou compte

### Build

- Section **Build** → **+** → choisir le build uploadé à l'étape 6 (apparaît après processing)
- **Export Compliance** : "No" si tu n'utilises pas de chiffrement custom (HTTPS standard exempté)
- **Content Rights** : confirmer
- **Advertising Identifier (IDFA)** : "No" (Celio n'utilise pas d'IDFA)

---

## 8. Soumission

- En haut à droite : **Add for Review** → **Submit for Review**
- Délai moyen review Apple : **24-48h** (parfois 24h, parfois 7 jours)
- Si rejet, lire le motif dans **Resolution Center** et corriger

---

## Risques de rejet à anticiper

| Guideline | Risque | Mitigation |
|---|---|---|
| **4.2** (minimum functionality) | App = juste un site web wrapped | ✅ Mode bundle activé (`webDir: 'dist/public'`), pas de WebView vers une URL distante |
| **5.1.1** (privacy) | Pas de privacy policy | Créer `https://celiopromo.it/privacy` |
| **2.1** (app completeness) | Try-on plante (ex : Replicate token expiré) | Vérifier `/api/health` ou test try-on avant Archive |
| **3.1.5(a)** (physical goods) | OK : vente de vêtements physiques autorisée hors IAP | Aucune action |
| **5.1.2** (data collection) | Photo try-on uploadée sans explication | NSCameraUsageDescription en italien clair |

---

## Mise à jour ultérieure

Pour pousser une nouvelle version :

1. Sur Mac : `git pull && npm install && npm run app:ios`
2. Dans Xcode : incrémenter **Build** (ex `2`) et/ou **Version** (ex `1.0.1`)
3. Product → Archive → Distribute App → Upload
4. Sur App Store Connect : créer **+ Version 1.0.1** → sélectionner le nouveau build → Submit

---

## Build cloud (si pas de Mac)

Alternative à un Mac physique :

- **Codemagic** : free tier 500 min/mois, intégration GitHub directe, ~$28/mois ensuite
- **Ionic Appflow** : ~$95/mois, fait par les créateurs de Capacitor
- **GitHub Actions** : runner `macos-latest` (~$0.08/min). Workflow custom à écrire — peut être ajouté plus tard si besoin

Codemagic est le plus simple : il détecte Capacitor automatiquement et te demande juste le certificat App Store et le profile de provisioning (générés sur developer.apple.com).
