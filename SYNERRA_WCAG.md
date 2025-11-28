# Synerra ja WCAG 2.1 AA

Tämä dokumentti kuvaa, miten Synerra pyrkii täyttämään WCAG 2.1 AA -vaatimukset ja miten asiaa testataan.  
Dokumentti ei väitä, että kaikki kriteerit olisivat jo toteutuneet, vaan kertoo nykytilan ja seuraavat askeleet.

Lähtökohtana on WCAG 2.1 -checklist (kma.global / WCAG 2.1 Checklist) ja Synerraan rakennettava
automaatiotestaus Cypressin ja Axe-työkalun avulla.

## Tavoite ja rajaus

- Tavoite: tärkeimmät käyttäjäpolut (kirjautuminen, rekisteröityminen, dashboard, pelaajien haku, kaveripyynnöt, chat, asetukset)
  noudattavat WCAG 2.1 AA -tasoa.
- Rajaus: dokumentti keskittyy käyttöliittymään (frontend). Backend ei ole tämän dokumentin fokuksessa.
- Tila: suurin osa WCAG-kriteereistä on tällä hetkellä “ei arvioitu” tai “osittain katettu”.  
  Vaatimustenmukaisuus varmistuu vasta, kun manuaali- ja automaatiotestit on ajettu kaikkien näkymien yli.

## Käytetyt standardit

- WCAG 2.1 tasot A ja AA
- WAI-ARIA 1.2 (tarvittaessa nimeämiseen ja rooleihin)
- WCAG 2.2 -kriteerejä ei virallisesti tavoitella tässä dokumentissa, mutta joitain niihin liittyviä hyviä käytäntöjä
  (esim. 44 x 44 px kosketusalueet) voidaan käyttää omana lisätavoitteena.

## Testausmalli

### Automaatiotestit (Cypress + Axe)

Tällä hetkellä toteutettu tai rakenteilla:

- Axe-perustesti (WCAG 2.1 AA -tagit)
  - `frontend/cypress/e2e/performance-accessibility.cy.ts`
    - Tarkistaa perus WCAG 2.1 AA -virheet seuraavilla sivuilla:
      - kirjautuminen sähköpostilla (`/login/email`)
      - dashboard (`/dashboard`)
      - pelaajien haku (`/dashboard/find-players`)
      - profiiliasetukset (`/dashboard/settings/profile`)
- Tekstivälit (1.4.12 Text Spacing)
  - Cypress-komento `cy.applyTextSpacing()` lisää WCAG:n mukaiset tekstiväliasetukset.
  - Tällä hetkellä käytössä login-sivulla; tarkoitus on laajentaa muillekin sivuille.
- Näppäimistön fokus
  - Login-lomakkeella testataan, että TAB siirtää fokuksen eteenpäin loogisesti ja että näkyvä fokusindikaattori on olemassa.
  - Tavoitteena on laajentaa sama tarkistus navigaatioon, tärkeimpiin painikkeisiin ja lomakkeisiin.
- Kosketusalueiden koko (44 x 44 px lisätavoitteena mobiilissa)
  - Dashboardin mobiilinäkymässä (esim. 390 x 844 viewport) mitataan osan navigaation painikkeiden fyysinen koko.
  - Tavoite: tärkeimpien painikkeiden ja navigaatiolinkkien klikkausalue on vähintään 44 x 44 CSS pikseliä.
- Raportointi
  - `cy.checkA11yInjected()` tallettaa mahdolliset Axe-virheet JSON-muotoon (`frontend/cypress/reports/...`),
    jotta löydökset voidaan käydä läpi testien jälkeen.

Suunniteltuja laajennuksia automaatioon:

- Lisää Axe-ajoja:
  - rekisteröityminen, profiilin luonti, kaveripyynnöt, chatinäkymä ja muut dashboardin alasivut
  - lomakevirhetilanteet (virheelliset syötteet, tyhjät pakolliset kentät)
- Tarkemmat fokusjärjestystestit:
  - koko sivun TAB-ketju, ettei samaan elementtiin pysähdytä kahdesti ennen seuraavaa
  - ESCin toiminta modaleissa ja valikoissa.

### Manuaalitestit

Automaatiot eivät yksin riitä WCAG-vaatimusten todentamiseen. Manuaalitesteillä varmistetaan erityisesti:

- Näppäimistökäyttö
  - Sivut toimivat pelkällä näppäimistöllä (TAB, SHIFT+TAB, ENTER, SPACE, ESC).
  - Fokusjärjestys on looginen (esim. ylhäältä alas, vasemmalta oikealle, ilman “hyppyjä”).
- Fokusrenkaat
  - Jokaisella interaktiivisella elementillä on selkeä ja riittävän näkyvä fokusindikaattori.
- Tekstivälit ja luettavuus
  - Tekstivälejä kasvatettaessa (1.4.12) sisältö ei mene päällekkäin tai leikkaannu.
- Kontrastit
  - Tekstin ja taustan kontrasti on riittävä (pieni teksti vähintään 4.5:1).
  - Fokusrenkaan kontrasti taustaan nähden on riittävä.
- Zoom ja uudelleenjako (reflow)
  - 200 % zoom ja kapea (esim. 320 px) näkymä: sisältö näkyy ilman turhaa vaakasuuntaista skrollausta,
    lukuun ottamatta tilanteita, joissa vaakaskrolli on väistämätön (esim. leveät taulukot).
- Ruudunlukija
  - Otsikkotasot, linkkitekstit, lomakekenttien labelit ja virheilmoitukset ovat ymmärrettäviä
    ja luetaan loogisessa järjestyksessä.

## WCAG 2.1 AA – keskeiset kriteerit Synerralle

Taulukko ei kata kaikkia WCAG-kriteerejä, vaan keskittyy Synerran kannalta tärkeimpiin.  
“Tila” kuvaa tämän hetken realistista tilannetta.

| Kriteeri | Lyhyt kuvaus | Testitapa (nykyinen / suunniteltu) | Tila |
| --- | --- | --- | --- |
| 1.1.1 Tekstivastineet | Kuvilla ja ikoneilla on tekstivastine, dekoratiiviset ohitetaan. | Koodikatselmointi, Axe (osittain) | Ei arvioitu |
| 1.3.1/1.3.2 Rakenne ja merkitys | Otsikot, listat ja lomakkeet ovat semanttisesti oikein. | Axe login/dashboard/find-players/settings, manuaalikatselmus | Osittain katettu |
| 1.4.3 Kontrasti (minimi) | Tekstin ja taustan kontrasti riittävä. | Axe, manuaalinen tarkistus käyttöliittymän teeman mukaan | Ei arvioitu |
| 1.4.10 Reflow | Sivut toimivat kapealla viewportilla ja 200 % zoomilla. | Manuaalitesti mobiilinäkymässä ja zoomilla | Ei arvioitu |
| 1.4.12 Text Spacing | Tekstivälien kasvatus ei riko sisältöä. | Cypress `cy.applyTextSpacing()` login-sivulla, laajennus muille sivuille | Osittain katettu |
| 2.1.1/2.1.2 Näppäimistökäyttö | Kaikki toiminnot käytettävissä ilman hiirtä, ei keyboard-trappeja. | Cypress-fokustesti loginissa, manuaalinen TAB-sweep | Osittain katettu |
| 2.4.3 Fokusjärjestys | Fokus etenee loogisessa järjestyksessä. | Manuaalitesti peruspoluilla, Cypress-laajennus suunnitteilla | Ei arvioitu |
| 2.4.7 Näkyvä fokus | Fokus näkyy selvästi kaikissa interaktiivisissa elementeissä. | Cypress-login fokus, manuaalinen tarkistus eri sivuilla | Osittain katettu |
| 2.5.5 Pointer Target (lisätavoite) | Tärkeiden painikkeiden kosketusalue vähintään 44 x 44 px. | Cypress mittaus osalle mobiilin navigointipainikkeista | Osittain katettu |
| 3.3.1/3.3.2 Lomakevirheet | Virheilmoitukset ovat selkeitä ja sidottuja kenttiin. | Axe (osittain), manuaalitesti virhetilanteilla | Ei arvioitu |
| 4.1.2 Nimi, rooli, tila | Komponenttien nimi/rooli/tila ohjelmallisesti saatavilla. | Axe, koodikatselmointi | Ei arvioitu |

## Seuraavat askeleet

1. Laajenna Axe-testausta kaikkiin keskeisiin sivuihin (rekisteröityminen, profiilin luonti, kaveripyynnöt, chat).
2. Lisää Cypress-testejä, jotka:
   - käyvät läpi sivun TAB-järjestyksen ja tarkistavat näkyvän fokuksen
   - käyttävät tekstivälioverridet myös muilla sivuilla kuin loginissa
   - varmistavat tärkeimpien mobiilielementtien vähintään 44 x 44 px kosketusalueen.
3. Tee manuaalinen WCAG-läpikäynti tärkeimmille näkymille (näppäimistö, zoom/reflow, ruudunlukija) ja päivitä tämän dokumentin “Tila”-sarake.
4. Pidä dokumentti elävänä: kun UI:ta muutetaan, päivitä testit ja tämä WCAG-kuvaus vastaamaan todellista tilannetta.
