import { FindPlayersComponent } from './find-players.component';
import { of, BehaviorSubject } from 'rxjs';
import { User } from '../../core/interfaces/user.model';

/**
 * Pure unit tests for FindPlayersComponent logic that avoid Angular TestBed
 * and heavy DI. These tests follow the project's TEST_PLAN advice to test
 * component pure logic (input -> output) without mocking HTTP or adding
 * router providers.
 */
describe('FindPlayersComponent (pure logic)', () => {
  it('onFiltersChanged should filter users by username, languages, games and Status', () => {
    // Minimal stubbed dependencies (only the properties used in constructor)
    // We'll avoid invoking the real constructor because it uses Angular's
    // `effect()` which requires an injection context. Instead create a
    // component-like object from the prototype and set only the fields we need.
    const comp = Object.create(
      FindPlayersComponent.prototype
    ) as FindPlayersComponent & {
      filteredUsers$: any;
      users$: any;
      user: any;
    };

    // Prepare a set of users to test filtering logic
    const users: User[] = [
      {
        PK: 'USER#1',
        SK: 'PROFILE',
        Username: 'Alice',
        Username_Lower: 'alice',
        Email: 'a@example.com',
        Languages: ['en'],
        PlayedGames: [{ gameId: 'g1', gameName: 'Game1' }],
        Status: 'online',
      },
      {
        PK: 'USER#2',
        SK: 'PROFILE',
        Username: 'Bob',
        Username_Lower: 'bob',
        Email: 'b@example.com',
        Languages: ['fi'],
        PlayedGames: [{ gameId: 'g2', gameName: 'Game2' }],
        Status: 'offline',
      },
      {
        PK: 'USER#3',
        SK: 'PROFILE',
        Username: 'Charlie',
        Username_Lower: 'charlie',
        Email: 'c@example.com',
        Languages: ['en', 'fi'],
        PlayedGames: [{ gameId: 'g1', gameName: 'Game1' }],
        Status: 'online',
      },
    ];

    // Set up the minimal properties used by onFiltersChanged
    comp.filteredUsers$ = new BehaviorSubject<User[]>([]);
    comp.users$ = of(users);
    comp.user = null;
    // Ensure filteredUsers$ starts empty
    expect(comp.filteredUsers$.getValue()).toEqual([]);

    // 1) Filter by username substring (case-insensitive)
    comp.onFiltersChanged({
      username: 'ali',
      Status: '',
      languages: [],
      games: [],
    });
    let got = comp.filteredUsers$.getValue();
    expect(got.length).toBe(1);
    expect(got[0].Username).toBe('Alice');

    // 2) Filter by language (fi)
    comp.onFiltersChanged({
      username: '',
      Status: '',
      languages: ['fi'],
      games: [],
    });
    got = comp.filteredUsers$.getValue();
    expect(got.length).toBe(2);
    const names = (got as User[]).map((u: User) => u.Username).sort();
    expect(names).toEqual(['Bob', 'Charlie']);

    // 3) Filter by game id 'g1'
    comp.onFiltersChanged({
      username: '',
      Status: '',
      languages: [],
      games: ['g1'],
    });
    got = comp.filteredUsers$.getValue();
    expect(got.length).toBe(2);
    expect((got as User[]).map((u: User) => u.Username).sort()).toEqual([
      'Alice',
      'Charlie',
    ]);

    // 4) Filter by online status
    comp.onFiltersChanged({
      username: '',
      Status: 'online',
      languages: [],
      games: [],
    });
    got = comp.filteredUsers$.getValue();
    expect(got.length).toBe(2);
    expect((got as User[]).map((u: User) => u.Username).sort()).toEqual([
      'Alice',
      'Charlie',
    ]);
  });
});
