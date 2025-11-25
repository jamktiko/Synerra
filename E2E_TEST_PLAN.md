# Synerra Cypress E2E -testaussuunnitelma v0.1

## Tavoite ja periaatteet
- Todentaa kriittisimmät asiakaspolut oikeaa käyttöä mukaillen (navigointi, haku, sosiaalinen vuorovaikutus, asetusten säilyvyys).
- Minimoida mockaus: salli verkko->API-kutsut jos testipalvelin käytössä, muuten käytä `cy.intercept`iä deterministisiin vasteisiin.
- Käytä ensisijaisesti saavutettavuuspohjaisia selectoreita (role, label) ja lisää tarvittaessa `data-cy`-attribuutteja.

## Ympäristö ja asetukset
- Frontend auki: `cd frontend && npm install && npm start` (oletus `http://localhost:4200`).
- Cypress UI: `cd frontend && npx cypress open` tai headless `npx cypress run`.
- Suositeltu kansiorakenne: `frontend/cypress/e2e/*.cy.ts`, ja `frontend/cypress/fixtures` API-vastauksille.
- Jos backend ei ole saatavilla, interceptaa keskeiset REST-kutsut (UserService, GameService, FriendService, AuthService) ja syötä fixtuureilla vakaat listaukset (pelit, käyttäjät, keskustelut, asetukset).

## Testidataperiaatteet
- Vähintään yksi valmiiksi luotu testikäyttäjä kirjautumista varten (tässä tapauksessa käytetään: `demo@mies.fi` / `Demo11`).
- Uuden käyttäjän flowissa siivoa luotu tili / käytä mock-vastetta, jotta testi on idempotentti.
- Pelidataa: vähintään 5 peliä eri genreillä ja suosiolla; käyttäjädataan kielet, platformit, status ja pelit IListalle friend-hakuja varten.

## Priorisoidut testitapaukset (Cypress)

### 1) Auth & Guardit
- **Unauth redirect:** suora URL `/${'dashboard'}` -> ohjautuu login-sivulle (AuthGuard toimii).
- **Login onnistuu:** syötä kelvollinen sähköposti/salasana -> päädyt dashboardille, navbar näyttää käyttäjän nimen.
- **Virheellinen kirjautuminen:** näytä virheilmoitus / pysy lomakkeella kun salasana väärä (mockkaa 401, jos ei oikeaa vastetta).

### 2) Signup ja salasanavaatimukset
- Syötä ei-sähköposti -> "Must be an actual email" näkyy.
- Syötä salasana ilman isoa kirjainta/numeroa/pituutta -> vaatimustila päivittyy (StateKey-kuvakkeet).
- Syötä eri vahvistus -> "Passwords do not match" näkyy; oikeilla arvoilla CTA aktivoituu ja kutsuu `signup()`.

### 3) Uuden käyttäjän onboarding
- Signup -> Profile creation CTA (route `/profile-creation`) näkyy ja vie eteenpäin.
- Käyttäjä voi poistua kirjautumalla ulos linkistä; session tyhjenee ja päätyy login-sivulle.

### 4) Dashboard perusnäkyma
- Dashboard näyttää tervetulotoivotuksen ja `Your favorite games` kun käyttäjällä on suosikit.
- Nuolinapit skrollaavat korttiriviä (DOM-scrollLeft muuttuu) sekä suosikit että `Popular games` -osiossa.

### 5) Pelien selaus (Choose Game)
- Navigointi sivulle `/dashboard/choose-game` navbarista toimii.
- Genre- ja hakufiltterit kaventavat listaa; suosio-sorting vaihtuu nouseva/laskeva `toggleSortOrder` kutsulla.
- Virheellisen datan (tyhjä lista) tapauksessa näkymä on tyhjä ilman erroreita (mockkaa tyhjä vaste).

### 6) Pelaajien haku ja kaveripyynnöt
- Navigointi `/dashboard/find-players` toimii sekä suoraan että query-paramilla `?game=<id>` jolloin pelivalinta preselectoituna.
- Kielisuodatin/online-status/pelit/platat rajaa `app-player-card`-elementtien määrää odotetusti (vertaa fixtuuriin).
- "Chat"-painike avaa keskustelun oikealla userId:llä (reitti `/dashboard/social/<id>` tai palvelukutsu). 
- "Add"-painike lähettää kaveripyynnön; nappi vaihtuu tekstiin "Request Sent" eikä ole klikattavissa.

### 7) Sosiaalinen näkymä
- Välilehtien vaihto (Messages/Notifications) vaihtaa näkyvän komponentin ja säilyttää valinnan sivulatauksella (local state / oletus?).
- Unread/notification-count päivittyy mock-vastauksesta; klikkaus keskusteluun vie `/dashboard/social/:id` ja renderöi `app-chat`.

### 8) Profiili- & tiliasetukset
- Profiilin kuvan valinta: tiedoston valinta näyttää tiedostonimen ja mahdollistaa Upload-napin; mockkaa onnistunut lataus -> näyttää "Uploaded!" linkin.
- Nimen/bion tallennus päivittää palautteen `feedbackMessages` (mockkaa 200 ja virhe 400).
- Kielivalinnat, playstyle ja platform-valinnat säilyvät tallennuksen jälkeen (reload tai uudelleenkysely mockattu).
- Tiliasetuksissa salasana-lomake: väärät arvot näyttävät kenttäkohtaiset virheet, validilla syötteellä `onSubmitPassword()` lähtee ja palautteen banneri näkyy.
- Link account -kortit: kytkin vaihtuu "Connect" -> "Connected" ja `linkedCount` päivittyy.
- Danger zone: "Delete account" avaa vahvistuksen; Cancel sulkee, Confirm kutsuu `confirmDeletion()` ja näyttää seuraamuksen (mockkaa 200/403).

### 9) Ilmoitusasetukset
- "Allow emails" master toggle disabloi/sallii alavalinnat; yksittäiset topic-valinnat voi muuttaa.
- "Save changes" kirjoittaa muutokset (mockkaa POST) ja näyttää `saveFeedback`.

### 10) Navigaatio ja responsiivisuus
- Navbarin "Settings"-alavalikko aukeaa ja korostaa aktiivisen reitin (queryParam `section=notifications` huomioidaan).
- Mobile breakpoints: selainleveyden muutos alle 1070 px kollapsaa navin; linkit toimivat myös mobile-navissa.

## Regressio- ja ei-toiminnalliset tsekit
- Perusreitit eivät tuota JavaScript-erroreita konsoliin (kuittaa `cy.on('uncaught:exception', ...)`).
- Latausajat: keskeiset sivut (login, dashboard, choose-game, find-players) < 3s fixtuureilla; raportoi jos hitaampia.
- Saavutettavuus smoke: `cy.injectAxe()` + `cy.checkA11y()` login- ja dashboard-sivuilla kriittisten virheiden varalta.

## Raportointi
- Tallennetaan kuvakaappaukset ja videot Cypressin oletuspolkuihin epäonnistumisista.
- Kirjataan löydökset projektin kanavaan: polku, odotettu vs. toteutunut, fixtuuri/ympäristö jolla toistui.
