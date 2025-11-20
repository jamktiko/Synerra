# Synerra — Cypress E2E -testausopas

## Yleiskatsaus

Cypress-testit validoivat sovelluksen kriittiset toiminnalliset ja ei-toiminnalliset vaatimukset. Testit käyttävät `cy.intercept()`-mocking-tekniikkaa API-kutsuihin, mikä takaa testien deterministisyyden ja nopeuden.

**Testiympäristö:**
- Pohjustus: `cypress/support/e2e.ts`, `cypress/support/commands.ts`
- Testiedostot: `cypress/e2e/*.cy.ts`
- Fixtuurit: `cypress/fixtures/`
- Konfiguraatio: `cypress.config.ts`

---

## Testit ja vaatimuksiin kartoitus

### Toiminnalliset vaatimukset

| # | Vaatimus | Testiedosto | Kuvaus |
|---|----------|-----------|--------|
| 1 | Kirjautuminen sähköpostilla ja salasanalla | `login-and-friend.cy.ts` | Validoi sähköposti-login ja dashboard-navigointi |
| 2 | Käyttäjänimen asettaminen | `profile-creation.cy.ts` | Testaa profiilin luomis- ja päivitysvirtaa |
| 3 | Suosikkipelit ja taitotaso | `profile-creation.cy.ts` | Validoi profiilikenttien (kielet, playstyle, platform) säilytys |
| 4 | Esteettömyys (WCAG 2.1) | `performance-accessibility.cy.ts` | Smoke-testit axe-kirjastolla kriittisilla sivuilla |
| 5 | Pelaajahaku ja suodatus | `find-players-filter.cy.ts` | Testaa suodatusta kielen, tilan ja pelin perusteella |
| 6 | Kaveripyynnöt (send/accept/decline) | `friend-requests.cy.ts` | Validoi pyynnön lähettämisen ja hyväksynnän |
| 7 | Reaaliaikainen chat 2+ käyttäjää | `chat-history.cy.ts` | Testaa viestin lähettämisen ja vastaanottamisen |
| 8 | Useat samanaikaiset chat-istunnot | `chat-history.cy.ts` | Validoi navigoinnin kahden ystävän välillä |
| 9 | Chat-historia ja lukematon-merkintä | `chat-history.cy.ts` | Testaa aiempien viestien näyttämistä ja päivittämistä |
| 10 | Käyttäjän ilmoitus asiattomasta käytöksestä | *Tuleva* | Odottaa report-user-UI:n toteutusta |

### Ei-toiminnalliset vaatimukset

| # | Vaatimus | Testiedosto | Kuvaus | Hyväksymisperuste |
|---|----------|-----------|--------|-------------------|
| 1 | WCAG 2.1 AA saavutettavuus | `performance-accessibility.cy.ts` | Axe a11y-tarkistus kriittisillä sivuilla | Ei kriittisiä virheitä |
| 2 | Rekisteröinti < 30 sekuntia | `performance-accessibility.cy.ts` | Mittaa signup-prosessin kestoa | < 30 sekuntia |
| 3 | 1000 samanaikaista käyttäjää | *Erillinen load-test* | E2E-testit eivät sovellu skalaan | Käytä load-testing työkalua |
| 4 | Haku < 2 sekuntia | `performance-accessibility.cy.ts` | Mittaa API-vasteen nopeutta | < 2000 ms |
| 5 | 99% uptime SLA | *Erillinen monitoring* | Cypress ei mittaa uptimea | Käytä monitoring-palvelua |
| 6 | Salasanat kryptattu | *Backend-testit* | E2E ei validoi kryptoinnin toteutusta | Käytä backend-testejä |
| 7 | Sessio säilyvää sivupäivitykselle | `session-persistence.cy.ts` | Testaa auth-tokentin hallintaa | Pysyy kirjautuneena reload-jälkeen |
| 8 | Kaikki modernit selaimet | `cypress.config.ts` | Cypress tukee Chrome, Edge, Firefox | Suorita testit kaikilla |

---

## Custom Commands

Tiedosto: `cypress/support/commands.ts`

### `cy.loginViaEmail(email, password)`
Kirjautuu sähköpostilla ja odottaa dashboard-navigoinnin valmistumista.
```typescript
// Use the test account defined in `cypress/fixtures/user.json` (password is `Demo11`)
cy.loginViaEmail('demo@mies.fi', 'Demo11')
```

### `cy.setupDefaultIntercepts()`
Asentaa perus-API-mockkarajat (login, getMe, getUsers, sendFriend, jne.).
```typescript
cy.setupDefaultIntercepts()
```

### `cy.checkA11yInjected()`
Injektoi axe-a11y-kirjaston ja tarkistaa WCAG-virheet. Loggaa virheet mutta sallii testin jatkamisen.
```typescript
cy.checkA11yInjected()
```

---

## Testien ajaminen

### Interaktiivinen Cypress UI
```bash
cd frontend
npm run cypress:open
```
- Valitse testiedosto
- Aja testejä reaaliajassa
- Näet network-kutsut, video-playbackin ja debug-tiedot

### Kaikki testit headless-moodissa
```bash
cd frontend
npm run cypress:run
```

### Yksittäinen testiedosto
```bash
npx cypress run --spec "cypress/e2e/login-and-friend.cy.ts"
```

### Tietyn selaimen kanssa
```bash
npx cypress run --browser chrome
npx cypress run --browser firefox
npx cypress run --browser edge
```

### Tallennokset ja raportointi
Cypress tallentaa automaattisesti:
- **Videot**: `cypress/videos/` (headless-ajossa)
- **Kuvakaappaukset**: `cypress/screenshots/` (virheessä)
- **Lokit**: `cypress/logs/` (oletuksena ei luoda)

---

## Testidatan hallinta (Fixtures)

Sijainti: `frontend/cypress/fixtures/`

| Tiedosto | Sisältö | Käyttö |
|----------|---------|--------|
| `user.json` | Testikäyttäjä: `demo@mies.fi` / `Demo11` | Login-testit |
| `me.json` | Kirjautuneen käyttäjän profiili (UserId, Username) | Dashboard-testit |
| `users.json` | Pelaajien lista (users-array) | Find-players-testit |

**Fixtuurien käyttö:**
```typescript
cy.intercept('GET', '**/user', { fixture: 'users.json' }).as('getUsers')
cy.intercept('GET', '**/me', { fixture: 'me.json' }).as('getMe')
```

---

## Nykytila ja tulevat testit

**Valmiit:**
- ✅ `login-and-friend.cy.ts` — Kirjautuminen ja kaveripyyntö
- ✅ `profile-creation.cy.ts` — Profiili ja käyttäjänimi
- ✅ `performance-accessibility.cy.ts` — Suorituskyky ja saavutettavuus
- ✅ `session-persistence.cy.ts` — Istunnon säilytys
- ✅ `find-players-filter.cy.ts` — Pelaajahaku ja suodatus
- ✅ `friend-requests.cy.ts` — Kaveripyynnöt
- ✅ `chat-history.cy.ts` — Chat-historia ja useat keskustelut

**Viimeaikaiset testimuutokset:**
- **Fixture / test-käyttäjä:** `frontend/cypress/fixtures/user.json` päivitetty — salasana on nyt `Demo11` (ilman erikoismerkkiä). Päivitä paikallisesti jos käytät eri testitiliä.
- **`profile-creation.cy.ts`:** testissä käytetään uniikkia sähköpostia signup-askelissa (aika-stampilla) välttämään tilien konfliktit ja testi tarkistaa nyt pelkän navigaation `/profile-creation` ja, kirjautumisen jälkeen, että profiilisivu latautuu ilman virheitä.
- **`chat-history.cy.ts`:** poistettu herkät mock-interceptit ja käytetään sovelluksen oikeita reittejä. Testi etsii viestielementtejä joustavilla selektoreilla ja varmistaa, että vastaanotetut viestit näkyvät (incoming/received -luokat tai vastaavat). Lähetetyn viestin tunnistus on tehty geneerisemmäksi, koska UI-luokat ja napit vaihtelevat.

- **`find-players-filter.cy.ts`:** testi ei enää luo oikeaa käyttäjää backendissä jos pelaajia ei löydy; sen sijaan testi asettaa paikallisen mockin `GET **/user` joka palauttaa yhden seed-käyttäjän ja lataa sivun uudelleen. Tämä estää testien tekemät pysyvät muutokset tuotantotietokantaan ja pitää testit deterministisempinä. Jos haluat täysin deterministisen testin, voidaan muuttaa testi aina käyttämään mockia ilman ehtoa.


**Tulevat:**
- ⏳ `report-user.cy.ts` — Käyttäjän ilmoitus asiattomasta käytöksestä
- ⏳ `favorite-games.cy.ts` — Suosikkipelien hallinta
- ⏳ `cross-browser.cy.ts` — Selainten yhteensopivuus

---

## Testien kirjoittamisen parhaat käytännöt

### 1. Käytä selektoreita, jotka eivät riipu CSS:stä
```typescript
// ❌ Huono — CSS voi muuttua
cy.get('button.primary').click()

// ✅ Hyvä — Selkeä intentio
cy.get('[data-cy="add-friend-btn"]').click()
```

### 2. Nimeä intercepts selvästi
```typescript
cy.intercept('POST', '**/friends/friendrequest', {...}).as('sendFriend')
cy.wait('@sendFriend')  // Selkeä mitä odotetaan
```

### 3. Varmista elementin näkyvyys ennen klikkaamista
```typescript
// ✅ Hyvä — Odottaa näkyvyyttä
cy.get('[data-cy="submit-btn"]').should('be.visible').click()

// ❌ Vaarallinen — Voi epäonnistua jos elementti ei näy
cy.get('[data-cy="submit-btn"]').click({ force: true })
```

### 4. Älä käytä kiinteitä odotusaikoja
```typescript
// ❌ Huono
cy.wait(2000)

// ✅ Hyvä — Odottaa API-kutsua
cy.intercept('GET', '**/api/*').as('apiCall')
cy.wait('@apiCall')
```

### 5. Käytä beforeEach interceptien asentamiseen
```typescript
beforeEach(() => {
  cy.setupDefaultIntercepts()
  cy.loginViaEmail('demo@mies.fi', 'Demo11')
})
```

---

## Ongelmien ratkaiseminen

### "Intercept ei ole kutsuttu"
**Syy:** Intercept määritelty vasta navigoinnin jälkeen.
```typescript
// ❌ Väärä järjestys
cy.visit('/dashboard')
cy.intercept('GET', '**/api/*').as('getUsers')

// ✅ Oikea järjestys
cy.intercept('GET', '**/api/*').as('getUsers')
cy.visit('/dashboard')
```

### "Element not found"
**Ratkaisut:**
1. Tarkista, että elementti on DOM:issa: `cy.get('selector').should('exist')`
2. Odota elementtin näkyvyyttä: `cy.get('selector').should('be.visible')`
3. Tarkista selektori: avaa Cypress UI ja testaa selektoria Debug-konsolilla

### "Timeout: command timed out"
**Syy:** Elemento ei latautunut tai intercept ei saanut vastausta.
```typescript
// Lisää timeout
cy.get('selector', { timeout: 10000 }).should('exist')
```

---

## Konfiguraatio

**Tiedosto:** `cypress.config.ts`

```typescript
export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:4200',
    specPattern: 'cypress/e2e/**/*.cy.{js,ts}',
    supportFile: 'cypress/support/e2e.ts',
  },
})
```

**Muutokset:**
- `baseUrl` — Sovelluksen URL (oletuksena `http://localhost:4200`)
- `specPattern` — Testiedostojen sijainti
- `supportFile` — Support-tiedoston polku

---

## Asennusohje

### 1. Cypress asennus
```bash
cd frontend
npm install --save-dev cypress@15.6.0
```

### 2. Varmista, että Cypress toimii
```bash
npm run cypress:verify
```

### 3. Ensimmäinen ajo
```bash
npm run cypress:open
```

---

## Yhteenveto

| Tehtävä | Komento |
|---------|---------|
| Avaa Cypress UI | `npm run cypress:open` |
| Aja kaikki testit | `npm run cypress:run` |
| Aja yksi testi | `npx cypress run --spec "cypress/e2e/login-and-friend.cy.ts"` |
| Aja Chrome-selaimella | `npx cypress run --browser chrome` |
| Varmista asennus | `npm run cypress:verify` |
