# Synerra Jest Unit Testing Plan v0.02a

## Testing Goals

Ensure the application works as expected, considering functionality, usability, and accessibility.

### Objectives

- Every component has at least one Jest test
- Key services and data flows are tested with mocked values

### Tools

- Testing framework: **Jest**
- Unit testing: **Angular Jest**
- Backend: **Jest tests for Lambdas**
- Angular testing environment: `@angular-builders/jest`
- Mocking: `jest-mock` or Angular's `TestBed`
- **IMPORTANT:**
  - Backend mocking is often necessary because services use external systems like AWS Lambda, S3, and RDS. Without mocks, these tests would be slow, unstable, and costly due to cloud service calls. Mocks enable safe and cost-effective testing of backend logic.
  - Frontend mocking should be minimized because its purpose is to represent the actual user experience as accurately as possible. Excessive mocking distorts real interaction and easily leads to tests that pass even when the application doesn't actually work.
  - Frontend testing focuses on verifying behavior and structure – ensuring components respond correctly to state changes, display the right elements, and work together with real service calls or mocked backend APIs.

---

## Running and Configuring Tests

### 1. Jest and Angular Setup

#### Package Installation

```bash
npm install --save-dev jest@29.7.0 ts-jest@29.2.5 jest-preset-angular@14.4.2 jest-environment-jsdom@29.7.0
npm install --save-dev zone.js @angular/core @angular/common --legacy-peer-deps
```

**Note:** `--legacy-peer-deps` bypasses version conflicts during installation.

#### Project Structure

```
Synerra_Git/
 ├─ backend/
 ├─ frontend/
 │   ├─ node_modules/
 │   ├─ src/
 │   ├─ package.json
 │   ├─ jest.config.js       ← Jest configuration
 │   ├─ setup-jest.ts       ← Angular test environment setup
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

#### angular.json Configuration

Replace Karma and Jasmine references with Jest:

```json
"test": {
  "builder": "@angular-builders/jest:run",
  "options": {
    "configPath": "jest.config.js"
  }
}
```

**Note:** Also remove all Karma and Jasmine references from `package.json`.

---

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (automatic re-run)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Open coverage report in browser (macOS)
open coverage/lcov-report/index.html
```

### Testing a Single Component

```bash
cd src/app/features/dashboard-page/dashboard
npx jest dashboard.component.spec.ts
```

---

## Unit Testing for Components

### Adding Mocks to Tests

When a component uses HTTP services or routing, add necessary mocks to the `.spec.ts` file.

#### Example 1: HttpClient Mock

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
        HttpClientTestingModule, // ← HTTP mock
      ],
    }).compileComponents();

    fixture = TestBed.createCreate(DashboardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
```

#### Example 2: ActivatedRoute Mock

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

## Testing Philosophy: Why WITHOUT Mocks?

### Kent C. Dodds and Testing Library Philosophy

> **"The more your tests resemble the way your software is used, the more confidence they can give you."**
>
> — Kent C. Dodds

In this project, we follow modern testing philosophy that **minimizes the use of mocks** and focuses on **testing behavior instead of implementation**.

### Problems with Mocks

#### 1. You Test Implementation, Not Behavior

Mocks tie tests to the component's **internal implementation**. If you refactor the code (change implementation but behavior stays the same), tests break unnecessarily.

**Example of a bad test:**

```typescript
// ❌ BAD: Testing that service was called
it('should call GameService', () => {
  const spy = jest.spyOn(gameService, 'listGames');
  component.ngOnInit();
  expect(spy).toHaveBeenCalled(); // ← This is an IMPLEMENTATION DETAIL!
});
```

**Why is this bad?**

- If you later change `listGames()` to another method (e.g., `getGames()`), the test breaks
- The test doesn't tell you if the component works correctly
- The test is tied to an implementation detail

#### 2. False Confidence

Mocks return **what you want**, not what the **real code returns**. Tests can pass even when the actual application is broken.

**Example:**

```typescript
// ❌ Mock always returns success
mockGameService.listGames.mockReturnValue(of([game1, game2]));

// Tests pass, but...
// ...the real GameService might be broken
// ...the real HTTP call might fail
// ...the real data might be in wrong format
```

#### 3. Difficult to Maintain

Every time you change code, you have to change mocks too. Tests become more complex than the code itself.

**Example:**

```typescript
// ❌ Complex mock setup
beforeEach(() => {
  mockGameService = {
    listGames: jest.fn().mockReturnValue(of(mockGames)),
  };
  mockUserStore = {
    user: signal(null),
    setUser: jest.fn((user) => userSignal.set(user)),
  };
  mockUserService = { getMe: jest.fn() };
  // ...and these need updating after every refactoring
});
```

#### 4. You Test Mocks, Not Real Code

Mocks bypass the real logic entirely. You're not testing the code that runs in production.

---

### Solution: Pure Function Testing

We test **component methods directly** without mocks, focusing on **input → output** logic.

#### Good Test: Pure Function

```typescript
// ✅ GOOD: Testing filterUserGames() method logic
describe('filterUserGames() - Filtering Logic', () => {
  beforeEach(() => {
    // Set test data DIRECTLY on component
    component.sortedGames = [
      { PK: 'GAME#cs2', Name: 'Counter-Strike 2', Popularity: 100 },
      { PK: 'GAME#lol', Name: 'League of Legends', Popularity: 95 },
      { PK: 'GAME#valorant', Name: 'Valorant', Popularity: 85 },
    ];
  });

  it('should filter games based on user games', () => {
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

**Why is this good?**

- ✅ Tests real logic (filtering, sorting)
- ✅ Not tied to implementation (you can refactor freely)
- ✅ Simple and readable
- ✅ Tests behavior: "When I give these games and these user games, I get these filtered games"

---

### What to Test WITHOUT Mocks?

#### 1. Component Logic (Pure Functions)

```typescript
// Test methods that transform data
- filterUserGames(): filters games
- applyFiltersAndSort(): sorts and filters
- onSearchChange(): handles search
```

#### 2. Component State

```typescript
// Test that component state updates correctly
expect(component.filteredGames).toEqual([...]);
expect(component.selectedGenre).toBe('FPS');
```

#### 3. Edge Cases

```typescript
// Test boundary conditions
- Empty arrays
- Undefined values
- Invalid formats
```

#### 4. UI Rendering

```typescript
// Test DOM elements
const button = fixture.debugElement.query(By.css('.login-button'));
expect(button).toBeTruthy();
```

---

### What NOT to Test in Unit Tests?

#### ❌ Service Calls

```typescript
// ❌ DON'T test
expect(gameService.listGames).toHaveBeenCalled();
```

**Why not?** This is an implementation detail. If you switch to a different service, the test breaks unnecessarily.

#### ❌ HTTP Calls

```typescript
// ❌ DON'T test in unit tests
mockHttp.get('/api/games').subscribe(...);
```

**Why not?** HTTP calls are tested in **integration tests** or **E2E tests**.

#### ❌ Angular Lifecycles (ngOnInit, ngOnDestroy)

```typescript
// ❌ DON'T test
it('should call loadGames on ngOnInit', () => {
  const spy = jest.spyOn(component, 'loadGames');
  component.ngOnInit();
  expect(spy).toHaveBeenCalled();
});
```

**Why not?** Lifecycle hooks are Angular's internal workings. Instead, test **what they do**, not **that they're called**.

---

### Real Dependencies in Tests

We use **real services** in tests, but **mock HTTP**:

```typescript
await TestBed.configureTestingModule({
  imports: [DashboardComponent],
  providers: [
    provideHttpClient(), // ← REAL HttpClient
    provideHttpClientTesting(), // ← HTTP mocked for tests
  ],
  schemas: [NO_ERRORS_SCHEMA],
}).compileComponents();
```

**Why this approach?**

- ✅ Component uses **real services**
- ✅ HTTP calls are automatically mocked
- ✅ No need to maintain complex mock objects

---

### Summary: Testing Strategy

| What to Test            | How to Test                | Why                      |
| ----------------------- | -------------------------- | ------------------------ |
| **Component Methods**   | Directly, without mocks    | Tests real logic         |
| **Data Transformations** | Input → Output            | Tests behavior           |
| **Edge Cases**          | Empty values, undefined    | Ensures robustness       |
| **UI Rendering**        | DOM queries                | Tests user interface     |
| **Services**            | REAL services, HTTP mocked | Tests integration        |

### End Result

- **Fewer mocks** = Less maintenance
- **Better confidence** = Tests test real code
- **Easier refactoring** = Tests don't break unnecessarily
- **Clearer tests** = Input → Output is easy to understand

---

## Additional Testing Patterns

### Testing Signals (Angular 17+)

```typescript
describe('Signal Updates', () => {
  it('should update signal value correctly', () => {
    // Arrange
    component.userSignal.set(null);
    
    // Act
    component.userSignal.set({ userId: '123', username: 'testuser' });
    
    // Assert
    expect(component.userSignal()).toEqual({ userId: '123', username: 'testuser' });
  });
});
```

### Testing Async Operations

```typescript
describe('Async Data Loading', () => {
  it('should handle async data correctly', async () => {
    // Arrange
    const testData = [{ id: 1, name: 'Test' }];
    
    // Act
    await component.loadData();
    
    // Assert
    expect(component.data).toEqual(testData);
  });
});
```

### Testing Error Handling

```typescript
describe('Error Handling', () => {
  it('should handle errors gracefully', () => {
    // Arrange
    component.data = null;
    
    // Act
    const result = component.processData();
    
    // Assert
    expect(result).toBeNull();
    expect(component.errorMessage).toBe('Data not available');
  });
});
```

---

## Summary

The Jest testing environment is now configured for the Angular project following these guidelines. Tests can be run with `npm test`, and a coverage report can be generated with `npm run test:coverage`.

Our testing philosophy is based on Kent C. Dodds' teachings: we test **behavior instead of implementation** and minimize the use of mocks. This makes tests more maintainable, reliable, and easier to understand.

### Key Principles

1. **Test behavior, not implementation** - Focus on what the code does, not how it does it
2. **Minimize mocks** - Use real dependencies whenever possible
3. **Test like a user** - Write tests that resemble how the software is actually used
4. **Keep tests simple** - Complex tests are hard to maintain and understand
5. **Focus on confidence** - Tests should make you confident the code works

### Benefits

- ✅ More reliable tests that catch real bugs
- ✅ Less brittle tests that don't break during refactoring
- ✅ Easier to understand and maintain
- ✅ Better representation of actual usage
- ✅ Higher confidence in code quality
