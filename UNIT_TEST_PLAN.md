# Synerra Jest-yksikkötestaussuunnitelma v0.02a

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
- Yksikkötestaus: **Angular Jest**
- End-to-end: **Cypress**
- Integraatiotestaus: **LocalStack/SAM testit Lambdoille**
- Angularin testausympäristö: `@angular-builders/jest`
- Mockaus: `jest-mock` tai Angularin `TestBed`
- HUOM.
  - Backendissä mockaus on usein välttämätöntä, koska palvelut käyttävät ulkoisia järjestelmiä, kuten AWS Lambdaa, S3:sta ja RDS:ää. Ilman mockeja nämä testit olisivat hitaita, epävakaita ja aiheuttaisivat kustannuksia pilvipalvelujen kutsuista. Mockit mahdollistavat backend-logiikan testaamisen turvallisesti ja edullisesti.
  - Frontendissä mockausta vältetään, koska sen tarkoitus on kuvata todellista käyttäjäkokemusta mahdollisimman tarkasti. Liiallinen mockaus vääristää todellista vuorovaikutusta ja johtaa helposti testeihin, jotka menevät läpi vaikka sovellus ei oikeasti toimisi.
  - Frontend-testauksen painopiste on käyttäytymisen ja rakenteen varmistamisessa – siinä, että komponentit reagoivat oikein tilamuutoksiin, näyttävät oikeat elementit ja toimivat yhdessä todellisten palvelukutsujen tai mockatun backend-rajapinnan kanssa.

---

## Testien suorittaminen ja konfigurointi

### 1. Jest ja Angularin esivalmistelut

#### Pakettien asennus

```bash
npm install --save-dev jest@29.7.0 ts-jest@29.2.5 jest-preset-angular@14.4.2 jest-environment-jsdom@29.7.0
npm install --save-dev zone.js @angular/core @angular/common --legacy-peer-deps
```

**Huom:** `--legacy-peer-deps` ohittaa versioristiriidat asennuksessa.

#### Projektirakenne

```
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
```

#### setup-jest.ts

```typescript
import 'zone.js';
import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';

getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting()
);
```

#### jest.config.js

```javascript
module.exports = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['ts', 'html', 'js', 'json'],
  moduleNameMapper: {
    '^@app/(.*)$': '<rootDir>/src/app/$1',
  },
  transformIgnorePatterns: ['node_modules/(?!.*\\.mjs$)'],
};
```

#### angular.json konfiguraatio

Vaihdetaan Karma ja Jasmine -viittaukset Jestiin:

```json
"test": {
  "builder": "@angular-builders/jest:run",
  "options": {
    "configPath": "jest.config.js"
  }
}
```

**Huom:** Poistetaan myös `package.json`-tiedostosta kaikki Karma- ja Jasmine-viittaukset.

---

## Testien ajaminen

```bash
# Aja kaikki testit
npm test

# Aja testit watch-tilassa (automaattinen uudelleenajo)
npm run test:watch

# Aja testit kattavuusraportin kanssa
npm run test:coverage

# Avaa coverage-raportti selaimessa (macOS)
open coverage/lcov-report/index.html
```

### Yksittäisen komponentin testaaminen

```bash
cd src/app/features/dashboard-page/dashboard
npx jest dashboard.component.spec.ts
```

---

## Yksikkötestaukset komponenteille

### Mockien lisääminen testeihin

Kun komponentti käyttää HTTP-palveluita tai routingia, lisää tarvittavat mockit `.spec.ts`-tiedostoon.

#### Esimerkki 1: HttpClient-mock

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { DashboardComponent } from './dashboard.component';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        DashboardComponent,
        HttpClientTestingModule, // ← HTTP-mock
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
```

#### Esimerkki 2: ActivatedRoute-mock

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { ChatPageComponent } from './chat-page.component';

describe('ChatPageComponent', () => {
  let component: ChatPageComponent;
  let fixture: ComponentFixture<ChatPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatPageComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({ id: '123' }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ChatPageComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
```

---

## Testausfilosofia: Miksi ILMAN mockeja?

### Kent C. Dodds ja Testing Library -filosofia

> **"The more your tests resemble the way your software is used, the more confidence they can give you."**
>
> — Kent C. Dodds

Tässä projektissa noudatamme modernia testausfilosofiaa, jossa **minimoidaan mockien käyttö** ja keskitytään **käyttäytymisen testaamiseen toteutuksen sijaan**.

### Ongelmat mockeissa

#### 1. Testaat toteutusta, et käyttäytymistä

Mockit sitovat testit komponentin **sisäiseen toteutukseen**. Jos refaktoroit koodin (muutat toteutuksen mutta käyttäytyminen pysyy samana), testit hajoavat turhaan.

**Esimerkki huonosta testistä:**

```typescript
// ❌ HUONO: Testataan että service kutsuttiin
it('pitäisi kutsua GameService', () => {
  const spy = jest.spyOn(gameService, 'listGames');
  component.ngOnInit();
  expect(spy).toHaveBeenCalled(); // ← Tämä on TOTEUTUSDETAILI!
});
```

**Miksi tämä on huono?**

- Jos myöhemmin vaihdat `listGames()` metodin toiseen (esim. `getGames()`), testi hajoaa
- Testi ei kerro mitään siitä, toimiiko komponentti oikein
- Testi on sidottu implementation detailiin

#### 2. False confidence (Väärä luottamus)

Mockit palauttavat **mitä sinä haluat**, eivät mitä **oikea koodi palauttaa**. Testit voivat mennä läpi vaikka oikea sovellus on rikki.

**Esimerkki:**

```typescript
// ❌ Mock palauttaa aina onnistumisen
mockGameService.listGames.mockReturnValue(of([game1, game2]));

// Testit menevät läpi, mutta...
// ...oikea GameService voi olla rikki
// ...oikea HTTP-kutsu voi epäonnistua
// ...oikea data voi olla väärässä formaatissa
```

#### 3. Vaikea ylläpitää

Joka kerta kun muutat koodia, joudut muuttamaan myös mockeja. Testit muuttuvat monimutkaisemmiksi kuin itse koodi.

**Esimerkki:**

```typescript
// ❌ Monimutkainen mock-setup
beforeEach(() => {
  mockGameService = {
    listGames: jest.fn().mockReturnValue(of(mockGames)),
  };
  mockUserStore = {
    user: signal(null),
    setUser: jest.fn((user) => userSignal.set(user)),
  };
  mockUserService = { getMe: jest.fn() };
  // ...ja näitä täytyy päivittää joka refaktoroinnin jälkeen
});
```

#### 4. Testaat mockeja, et oikeaa koodia

Mockit ohittavat oikean logiikan kokonaan. Et testaa sitä koodia, joka ajetaan tuotannossa.

---

### Ratkaisu: Pure Function Testing

Testaamme **suoraan komponentin metodeja** ilman mockeja, keskittyen **input → output** -logiikkaan.

#### Hyvä testi: Pure Function

```typescript
// ✅ HYVÄ: Testataan filterUserGames() -metodin logiikkaa
describe('filterUserGames() - Suodatuslogiikka', () => {
  beforeEach(() => {
    // Asetetaan test data SUORAAN komponenttiin
    component.sortedGames = [
      { PK: 'GAME#cs2', Name: 'Counter-Strike 2', Popularity: 100 },
      { PK: 'GAME#lol', Name: 'League of Legends', Popularity: 95 },
      { PK: 'GAME#valorant', Name: 'Valorant', Popularity: 85 },
    ];
  });

  it('pitäisi suodattaa pelit käyttäjän pelaamien mukaan', () => {
    // INPUT
    component.userGames = [
      { gameId: 'cs2', gameName: 'Counter-Strike 2' },
      { gameId: 'valorant', gameName: 'Valorant' },
    ];

    // RUN
    component.filterUserGames();

    // OUTPUT
    expect(component.filteredGames.length).toBe(2);
    expect(component.filteredGames[0].Name).toBe('Counter-Strike 2');
    expect(component.filteredGames[1].Name).toBe('Valorant');
  });
});
```

**Miksi tämä on hyvä?**

- ✅ Testaa todellista logiikkaa (suodatus, järjestäminen)
- ✅ Ei sidottu toteutukseen (voit refaktoroida vapaasti)
- ✅ Yksinkertainen ja luettava
- ✅ Testaa käyttäytymistä: "Kun annan nämä pelit ja nämä käyttäjän pelit, saan nämä suodatetut pelit"

---

### Mitä testataan ILMAN mockeja?

#### 1. Komponentin logiikka (Pure Functions)

```typescript
// Testaa metodeja jotka muuntavat dataa
- filterUserGames(): suodattaa pelejä
- applyFiltersAndSort(): järjestää ja suodattaa
- onSearchChange(): käsittelee hakua
```

#### 2. Komponentin tila

```typescript
// Testaa että komponentin state päivittyy oikein
expect(component.filteredGames).toEqual([...]);
expect(component.selectedGenre).toBe('FPS');
```

#### 3. Edge caset

```typescript
// Testaa reunatapaukset
- Tyhjät arrayt
- Undefined arvot
- Virheelliset formaatit
```

#### 4. UI-renderöinti

```typescript
// Testaa DOM-elementtejä
const button = fixture.debugElement.query(By.css('.login-button'));
expect(button).toBeTruthy();
```

---

### Mitä EI testata yksikkötesteissä?

#### ❌ Serviceiden kutsumista

```typescript
// ❌ ÄLÄ testaa
expect(gameService.listGames).toHaveBeenCalled();
```

**Miksi ei?** Tämä on toteutusdetaili. Jos vaihdat servicen toiseen, testi hajoaa turhaan.

#### ❌ HTTP-kutsuja

```typescript
// ❌ ÄLÄ testaa yksikkötesteissä
mockHttp.get('/api/games').subscribe(...);
```

**Miksi ei?** HTTP-kutsut testataan **integraatiotesteissä** tai **E2E-testeissä**.

#### ❌ Angular lifecyclejä (ngOnInit, ngOnDestroy)

```typescript
// ❌ ÄLÄ testaa
it('should call loadGames on ngOnInit', () => {
  const spy = jest.spyOn(component, 'loadGames');
  component.ngOnInit();
  expect(spy).toHaveBeenCalled();
});
```

**Miksi ei?** Lifecycle-hookit ovat Angularin sisäistä toimintaa. Testaa sen sijaan mitä ne **tekevät**, ei että ne **kutsutaan**.

---

### Oikeat riippuvuudet testeissä

Käytämme **oikeita serviceitä** testeissa, mutta **mockataan HTTP**:

```typescript
await TestBed.configureTestingModule({
  imports: [DashboardComponent],
  providers: [
    provideHttpClient(), // ← OIKEA HttpClient
    provideHttpClientTesting(), // ← HTTP mockattu testeihin
  ],
  schemas: [NO_ERRORS_SCHEMA],
}).compileComponents();
```

**Miksi näin?**

- ✅ Komponentti käyttää **oikeita serviceitä**
- ✅ HTTP-kutsut mockataan automaattisesti
- ✅ Ei tarvitse ylläpitää monimutkaisia mock-objekteja

---

### Yhteenveto: Testausstrategia

| Mitä testataan          | Miten testataan                | Miksi                       |
| ----------------------- | ------------------------------ | --------------------------- |
| **Komponentin metodit** | Suoraan, ilman mockeja         | Testaa todellista logiikkaa |
| **Datan muunnokset**    | Input → Output                 | Testaa käyttäytymistä       |
| **Edge caset**          | Tyhjät arvot, undefined        | Varmista robustisuus        |
| **UI-renderöinti**      | DOM-kyselyt                    | Testaa käyttöliittymää      |
| **Servicet**            | OIKEAT servicet, HTTP mockattu | Testaa integraatiota        |

### Lopputulos

- **Vähemmän mockeja** = Vähemmän ylläpitoa
- **Parempi luottamus** = Testit testaavat oikeaa koodia
- **Helpompi refaktorointi** = Testit eivät hajoa turhaan
- **Selkeämmät testit** = Input → Output on helppo ymmärtää

---

## Yhteenveto

Jest-testausympäristö on nyt näiden ohjeiden perusteella konfiguroitu Angular-projektiin. Testit voidaan ajaa `npm test` komennolla, ja kattavuusraportti generoidaan `npm run test:coverage` komennolla.

Testausfilosofiamme perustuu Kent C. Doddsin opetuksiin: testaamme **käyttäytymistä toteutuksen sijaan** ja minimoimme mockien käytön. Tämä tekee testeistä ylläpidettävämpiä, luotettavampia ja helpompia ymmärtää.
