// @ts-nocheck
import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
  flush,
} from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { PlayerFiltersComponent } from './player-filters.component';
import { GameService } from '../../../core/services/game.service';
import { of, throwError } from 'rxjs';
import { Game } from '../../../core/interfaces/game.model';

xdescribe('PlayerFiltersComponent - Filter & Search Tests', () => {
  let component: PlayerFiltersComponent;
  let fixture: ComponentFixture<PlayerFiltersComponent>;
  let gameService: GameService;

  const mockGames: Game[] = [
    {
      PK: 'GAME#cs2',
      SK: 'DETAILS',
      Name: 'Counter-Strike 2',
      Genre: 'FPS',
      Img_url: 'https://example.com/cs2.jpg',
      Popularity: 95,
    },
    {
      PK: 'GAME#valorant',
      SK: 'DETAILS',
      Name: 'Valorant',
      Genre: 'FPS',
      Img_url: 'https://example.com/valorant.jpg',
      Popularity: 90,
    },
    {
      PK: 'GAME#lol',
      SK: 'DETAILS',
      Name: 'League of Legends',
      Genre: 'MOBA',
      Img_url: 'https://example.com/lol.jpg',
      Popularity: 88,
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayerFiltersComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), GameService],
    }).compileComponents();

    fixture = TestBed.createComponent(PlayerFiltersComponent);
    component = fixture.componentInstance;
    gameService = TestBed.inject(GameService);

    // Mock loadGames by default
    jest.spyOn(gameService, 'listGames').mockReturnValue(of(mockGames));
  });

  describe('Component Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize empty filter values', () => {
      expect(component.filters.username).toBe('');
      expect(component.filters.languages).toEqual([]);
      expect(component.filters.onlineStatus).toBe('');
      expect(component.filters.games).toEqual([]);
    });

    it('should initialize searchControl', () => {
      expect(component.searchControl).toBeDefined();
      expect(component.searchControl.value).toBe('');
    });

    it('should initialize availableLanguages in alphabetical order', () => {
      fixture.detectChanges();
      expect(component.availableLanguages.length).toBeGreaterThan(0);
      // Check that languages are sorted
      const labels = component.availableLanguages.map((l) => l.label);
      const sortedLabels = [...labels].sort();
      expect(labels).toEqual(sortedLabels);
    });

    it('should set openDropdown null', () => {
      expect(component.openDropdown).toBeNull();
    });

    it('should set selectedStatusLabel "Any status"', () => {
      expect(component.selectedStatusLabel).toBe('Any status');
    });
  });

  describe('ngOnInit - Initial Loading', () => {
    it('should call loadGames', () => {
      const loadGamesSpy = jest
        .spyOn(gameService, 'listGames')
        .mockReturnValue(of(mockGames));

      component.ngOnInit();

      expect(loadGamesSpy).toHaveBeenCalled();
    });

    it('should set games in correct order', fakeAsync(() => {
      const unsortedGames = [...mockGames].reverse();
      jest.spyOn(gameService, 'listGames').mockReturnValue(of(unsortedGames));

      component.ngOnInit();
      tick();

      expect(component.games[0].Name).toBe('Counter-Strike 2');
      expect(component.games[2].Name).toBe('Valorant');
    }));

    it('should handle preSelectedGame input', () => {
      component.preSelectedGame = 'cs2';

      component.ngOnInit();

      expect(component.filters.games).toContain('cs2');
    });

    it('should avoid duplicates when preSelectedGame is present', () => {
      component.filters.games = ['cs2'];
      component.preSelectedGame = 'cs2';

      component.ngOnInit();

      expect(component.filters.games.length).toBe(1);
      expect(component.filters.games).toEqual(['cs2']);
    });

    it('should work without preSelectedGame', () => {
      component.preSelectedGame = null;

      component.ngOnInit();

      expect(component.filters.games).toEqual([]);
    });

    it('should set up searchControl debounce', fakeAsync(() => {
      const emitSpy = jest.spyOn(component.filtersChanged, 'emit');

      component.ngOnInit();
      component.searchControl.setValue('testuser');
      tick(400); // debounceTime 400ms

      expect(component.filters.username).toBe('testuser');
      expect(emitSpy).toHaveBeenCalled();
    }));

    it('should trim username whitespace', fakeAsync(() => {
      component.ngOnInit();
      component.searchControl.setValue(' testuser ');
      tick(400);

      expect(component.filters.username).toBe('testuser');
    }));

    it('should handle null username', fakeAsync(() => {
      component.ngOnInit();
      component.searchControl.setValue(null);
      tick(400);

      expect(component.filters.username).toBe('');
    }));

    it('should use distinctUntilChanged', fakeAsync(() => {
      const emitSpy = jest.spyOn(component.filtersChanged, 'emit');

      component.ngOnInit();
      component.searchControl.setValue('test');
      tick(400);
      emitSpy.mockClear();

      // Same value should not emit
      component.searchControl.setValue('test');
      tick(400);

      expect(emitSpy).not.toHaveBeenCalled();
    }));
  });

  describe('loadGames() - Game Loading', () => {
    it('should load games from GameService', fakeAsync(() => {
      const listGamesSpy = jest
        .spyOn(gameService, 'listGames')
        .mockReturnValue(of(mockGames));

      component['loadGames']();
      tick();

      expect(listGamesSpy).toHaveBeenCalled();
      expect(component.games).toEqual(mockGames);
    }));

    it('should sort games alphabetically', fakeAsync(() => {
      const unsortedGames: Game[] = [
        {
          PK: 'GAME#3',
          SK: 'DETAILS',
          Name: 'Zelda',
          Genre: 'Adventure',
          Popularity: 80,
        },
        {
          PK: 'GAME#1',
          SK: 'DETAILS',
          Name: 'Apex',
          Genre: 'FPS',
          Popularity: 85,
        },
        {
          PK: 'GAME#2',
          SK: 'DETAILS',
          Name: 'Minecraft',
          Genre: 'Sandbox',
          Popularity: 90,
        },
      ];

      jest.spyOn(gameService, 'listGames').mockReturnValue(of(unsortedGames));

      component['loadGames']();
      tick();

      expect(component.games[0].Name).toBe('Apex');
      expect(component.games[1].Name).toBe('Minecraft');
      expect(component.games[2].Name).toBe('Zelda');
    }));

    it('should handle error loadGames:ssa', fakeAsync(() => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      jest
        .spyOn(gameService, 'listGames')
        .mockReturnValue(throwError(() => new Error('Network error')));

      component['loadGames']();
      tick();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to load games',
        expect.any(Error)
      );
      expect(component.games).toEqual([]);
      consoleErrorSpy.mockRestore();
    }));

    it('should handle ei-array response', fakeAsync(() => {
      jest.spyOn(gameService, 'listGames').mockReturnValue(of(null as any));

      component['loadGames']();
      tick();

      expect(component.games).toEqual([]);
    }));
  });

  describe('onFilterChange() - event Emission', () => {
    it('should emit filtersChanged event', () => {
      const emitSpy = jest.spyOn(component.filtersChanged, 'emit');

      component.onFilterChange();

      expect(emitSpy).toHaveBeenCalledWith(component.filters);
    });

    it('should emit a copy of filters', () => {
      const emitSpy = jest.spyOn(component.filtersChanged, 'emit');

      component.onFilterChange();

      const emittedValue = emitSpy.mock.calls[0][0];
      expect(emittedValue).not.toBe(component.filters); // Different object reference
      expect(emittedValue).toEqual(component.filters); // Same content
    });
  });

  describe('toggleDropdown() - dropdown Management', () => {
    it('should open dropdown when closed', () => {
      component.openDropdown = null;

      component.toggleDropdown('languages');

      expect(component.openDropdown).toBe('languages');
    });

    it('should close dropdown when auki', () => {
      component.openDropdown = 'languages';

      component.toggleDropdown('languages');

      expect(component.openDropdown).toBeNull();
    });

    it('should toggle toiseen dropdowniin', () => {
      component.openDropdown = 'languages';

      component.toggleDropdown('games');

      expect(component.openDropdown).toBe('games');
    });

    it('should tukea kaikkia dropdown type', () => {
      component.toggleDropdown('languages');
      expect(component.openDropdown).toBe('languages');

      component.toggleDropdown('games');
      expect(component.openDropdown).toBe('games');

      component.toggleDropdown('status');
      expect(component.openDropdown).toBe('status');
    });
  });

  describe('onStatusChange() - status Filter', () => {
    it('should set online status', () => {
      const emitSpy = jest.spyOn(component.filtersChanged, 'emit');

      component.onStatusChange('online');

      expect(component.filters.onlineStatus).toBe('online');
      expect(component.selectedStatusLabel).toBe('Online');
      expect(emitSpy).toHaveBeenCalled();
    });

    it('should set offline status', () => {
      component.onStatusChange('offline');

      expect(component.filters.onlineStatus).toBe('offline');
      expect(component.selectedStatusLabel).toBe('Offline');
    });

    it('should set any status (empty)', () => {
      component.onStatusChange('');

      expect(component.filters.onlineStatus).toBe('');
      expect(component.selectedStatusLabel).toBe('Any status');
    });

    it('should close dropdown statuksen after', () => {
      component.openDropdown = 'status';

      component.onStatusChange('online');

      expect(component.openDropdown).toBeNull();
    });

    it('should emit filters event', () => {
      const emitSpy = jest.spyOn(component.filtersChanged, 'emit');

      component.onStatusChange('online');

      expect(emitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          onlineStatus: 'online',
        })
      );
    });
  });

  describe('onLanguageToggle() - Language Selection', () => {
    it('should add language when checked', () => {
      const event = { target: { checked: true } } as any;
      const emitSpy = jest.spyOn(component.filtersChanged, 'emit');

      component.onLanguageToggle(event, 'en');

      expect(component.filters.languages).toContain('en');
      expect(emitSpy).toHaveBeenCalled();
    });

    it('should remove language when unchecked', () => {
      component.filters.languages = ['en', 'fi'];
      const event = { target: { checked: false } } as any;

      component.onLanguageToggle(event, 'en');

      expect(component.filters.languages).toEqual(['fi']);
    });

    it('should add multiple languages', () => {
      const event = { target: { checked: true } } as any;

      component.onLanguageToggle(event, 'en');
      component.onLanguageToggle(event, 'fi');
      component.onLanguageToggle(event, 'sv');

      expect(component.filters.languages).toEqual(['en', 'fi', 'sv']);
    });

    it('should maintain other languages when removing one', () => {
      component.filters.languages = ['en', 'fi', 'sv'];
      const event = { target: { checked: false } } as any;

      component.onLanguageToggle(event, 'fi');

      expect(component.filters.languages).toEqual(['en', 'sv']);
    });

    it('should emit filtersChanged', () => {
      const event = { target: { checked: true } } as any;
      const emitSpy = jest.spyOn(component.filtersChanged, 'emit');

      component.onLanguageToggle(event, 'en');

      expect(emitSpy).toHaveBeenCalled();
    });
  });

  describe('onGameToggle() - Game Selection', () => {
    it('should add game when checked', () => {
      const event = { target: { checked: true } } as any;

      component.onGameToggle(event, 'GAME#cs2');

      expect(component.filters.games).toContain('GAME#cs2');
    });

    it('should remove peli when unchecked', () => {
      component.filters.games = ['GAME#cs2', 'GAME#valorant'];
      const event = { target: { checked: false } } as any;

      component.onGameToggle(event, 'GAME#cs2');

      expect(component.filters.games).toEqual(['GAME#valorant']);
    });

    it('should add multiple games', () => {
      const event = { target: { checked: true } } as any;

      component.onGameToggle(event, 'GAME#cs2');
      component.onGameToggle(event, 'GAME#valorant');
      component.onGameToggle(event, 'GAME#lol');

      expect(component.filters.games.length).toBe(3);
    });

    it('should emit filtersChanged', () => {
      const event = { target: { checked: true } } as any;
      const emitSpy = jest.spyOn(component.filtersChanged, 'emit');

      component.onGameToggle(event, 'GAME#cs2');

      expect(emitSpy).toHaveBeenCalled();
    });
  });

  describe('@HostListener - Outside Click & Escape', () => {
    it('should close dropdown when clicking outside the document', () => {
      component.openDropdown = 'languages';
      const event = new MouseEvent('click');
      Object.defineProperty(event, 'target', {
        value: document.createElement('div'),
        enumerable: true,
      });

      component.handleOutsideClick(event);

      expect(component.openDropdown).toBeNull();
    });

    it('should close dropdown on escape key', () => {
      component.openDropdown = 'games';

      component.handleEscape();

      expect(component.openDropdown).toBeNull();
    });

    it('should not close when clicking inside the dropdown', () => {
      component.openDropdown = 'languages';

      const dropdownElement = document.createElement('div');
      dropdownElement.className = 'checkbox-collapsible';
      const clickTarget = document.createElement('span');
      dropdownElement.appendChild(clickTarget);

      const event = new MouseEvent('click');
      Object.defineProperty(event, 'target', {
        value: clickTarget,
        enumerable: true,
      });

      component.handleOutsideClick(event);

      expect(component.openDropdown).toBe('languages');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty games array', fakeAsync(() => {
      jest.spyOn(gameService, 'listGames').mockReturnValue(of([]));

      component['loadGames']();
      tick();

      expect(component.games).toEqual([]);
    }));

    it('should handle special characters in username search', fakeAsync(() => {
      component.ngOnInit();
      component.searchControl.setValue('test@#$%user!');
      tick(400);

      expect(component.filters.username).toBe('test@#$%user!');
    }));

    it('should handle very long username', fakeAsync(() => {
      const longName = 'a'.repeat(100);
      component.ngOnInit();
      component.searchControl.setValue(longName);
      tick(400);

      expect(component.filters.username).toBe(longName);
    }));

    it('should handle all filters together', () => {
      const emitSpy = jest.spyOn(component.filtersChanged, 'emit');

      component.filters.username = 'testuser';
      component.filters.languages = ['en', 'fi'];
      component.filters.onlineStatus = 'online';
      component.filters.games = ['GAME#cs2', 'GAME#valorant'];

      component.onFilterChange();

      expect(emitSpy).toHaveBeenCalledWith({
        username: 'testuser',
        languages: ['en', 'fi'],
        onlineStatus: 'online',
        games: ['GAME#cs2', 'GAME#valorant'],
      });
    });

    it('should ignore empty preSelectedGame string', () => {
      component.preSelectedGame = '';

      component.ngOnInit();

      // Empty string should not be added to games array
      expect(component.filters.games).toEqual([]);
    });
  });
});
