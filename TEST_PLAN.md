# SYNERRAN TESTAUSSUUNNITELMA

## Testauksen tavoitteet

Varmennetaan, että sovellus toimii odotetusti huomioiden toiminnallisuus, käytettävyys ja saavutettavuus.

### Testitasot

- **Yksikkötestit (Unit tests):** Testataan yksittäisiä komponentteja, pipeja ja palveluita Angularin Jestillä.
- **Integraatiotestit:** Testataan, miten useat osat toimivat yhdessä (esim. komponentti + AWS palvelu).
- **Manuaalinen käyttötestaus:** Testataan, että käyttöliittymä toimii selaimessa oikein (erityisesti kriittiset polut kuten kirjautuminen tai lomakkeiden lähetys).
- **End-to-end testit (E2E):** Suoritetaan Cypressillä.

### Tavoitteet

- Jokaisella komponentilla on vähintään yksi Jest-testi.
- Tärkeimmät palvelut (services) ja datavirrat testataan mockatuilla arvoilla.

### Työkalut

- Testauskehys: **Jest**
- Yksikkötestaus: Angular Jest
- End-to-end: Cypress
- Integraatiotestaus: LocalStack/SAM testit Lambdoille
- Angularin testausympäristö: `@angular-builders/jest`
- Mockaus: `jest-mock` tai Angularin `TestBed`

---

## Testien suorittaminen ja konfigurointi

### 1. Jest ja Angularin esivalmistelut

Asennetaan testauspaketit frontend-projektiin:

```bash
npm install --save-dev jest@29.7.0 ts-jest@29.1.0 jest-preset-angular@13.1.2 @types/jest@29.5.3 --legacy-peer-deps

npm install --save-dev zone.js @angular/core @angular/common --legacy-peer-deps

Synerra_Git/
 ├─ backend/
 ├─ frontend/
 │   ├─ node_modules/
 │   ├─ src/
 │   ├─ package.json
 │   ├─ jest.config.js       ← Jest-konfiguraatio
 │   ├─ setup-jest.ts       ← Angularin testausympäristön alustus
 │   └─ tsconfig.json
 └─ ...

# setup-jest.ts:

import 'jest-preset-angular/setup-jest';
import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';

// Nollaa Angularin testausympäristön ja alustaa sen uudelleen
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting()
);


# jest.config.js:

module.exports = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['ts', 'html', 'js', 'json'],
  transform: {
    '^.+\\.(ts|js|html)$': 'ts-jest',
  },
};



# Angular.json -konfiguraatio. Vaihdetaan Karma ja Jasmine -viittaukset Jestiin.

"test": {
  "builder": "@angular-builders/jest:run",
  "options": {
    "configPath": "jest.config.js"
  }
}


# Vanhojen testauspakettien poisto

Poistettiin package.json-tiedostosta kaikki Karma- ja Jasmine-viittaukset.


# Testien suorittaminen

npm install --legacy-peer-deps


# Yksittäisen komponentin testaaminen esimerkki

cd src/app/features/dashboard-page/dashboard
npx jest dashboard.component.spec.ts

```
