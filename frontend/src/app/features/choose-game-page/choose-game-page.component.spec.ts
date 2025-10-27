import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ChooseGamePageComponent } from './choose-game-page.component';
import { Game } from '../../core/interfaces/game.model';
import { By } from '@angular/platform-browser';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('ChooseGamePageComponent - UI & Pure Function Tests', () => {
  let component: ChooseGamePageComponent;
  let fixture: ComponentFixture<ChooseGamePageComponent>;

  const mockGames: Game[] = [
    {
      PK: 'GAME#1',
      SK: 'DETAILS',
      Name: 'Counter-Strike 2',
      Genre: 'FPS',
      Popularity: 100,
      Img_url: 'https://example.com/cs2.jpg',
    },
    {
      PK: 'GAME#2',
      SK: 'DETAILS',
      Name: 'League of Legends',
      Genre: 'MOBA',
      Popularity: 95,
      Img_url: 'https://example.com/lol.jpg',
    },
    {
      PK: 'GAME#3',
      SK: 'DETAILS',
      Name: 'Valorant',
      Genre: 'FPS',
      Popularity: 85,
      Img_url: 'https://example.com/valorant.jpg',
    },
    {
      PK: 'GAME#4',
      SK: 'DETAILS',
      Name: 'Dota 2',
      Genre: 'MOBA',
      Popularity: 80,
      Img_url: 'https://example.com/dota2.jpg',
    },
    {
      PK: 'GAME#5',
      SK: 'DETAILS',
      Name: 'Apex Legends',
      Genre: 'FPS',
      Popularity: 75,
      Img_url: 'https://example.com/apex.jpg',
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChooseGamePageComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ChooseGamePageComponent);
    component = fixture.componentInstance;
  });

  describe('Component Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize games as empty array', () => {
      expect(component.games).toEqual([]);
    });

    it('should initialize filteredGames as empty array', () => {
      expect(component.filteredGames).toEqual([]);
    });

    it('should initialize descending to true', () => {
      expect(component.descending).toBe(true);
    });

    it('should initialize searchText as empty', () => {
      expect(component.searchText).toBe('');
    });

    it('should initialize selectedGenre as empty', () => {
      expect(component.selectedGenre).toBe('');
    });
  });

  describe('toggleSortOrder() - State Management', () => {
    beforeEach(() => {
      component.games = [...mockGames];
    });

    it('should toggle descending from false to true', () => {
      component.descending = false;
      component.toggleSortOrder();
      expect(component.descending).toBe(true);
    });

    it('should toggle descending from true to false', () => {
      component.descending = true;
      component.toggleSortOrder();
      expect(component.descending).toBe(false);
    });

    it('should work with multiple consecutive calls', () => {
      component.descending = true;
      component.toggleSortOrder(); // -> false
      expect(component.descending).toBe(false);
      component.toggleSortOrder(); // -> true
      expect(component.descending).toBe(true);
      component.toggleSortOrder(); // -> false
      expect(component.descending).toBe(false);
    });

    it('should update filteredGames when descending changes', () => {
      component.descending = true;
      component.applyFiltersAndSort();
      const descendingOrder = [...component.filteredGames];

      component.toggleSortOrder(); // switch to ascending
      const ascendingOrder = [...component.filteredGames];

      expect(descendingOrder[0].Popularity).toBeGreaterThan(
        descendingOrder[descendingOrder.length - 1].Popularity
      );
      expect(ascendingOrder[0].Popularity).toBeLessThan(
        ascendingOrder[ascendingOrder.length - 1].Popularity
      );
    });
  });

  describe('onFilterChanged() - State Management', () => {
    it('should set selectedGenre and searchText', () => {
      const filters = { genre: 'FPS', search: 'Counter' };
      component.onFilterChanged(filters);

      expect(component.selectedGenre).toBe('FPS');
      expect(component.searchText).toBe('Counter');
    });

    it('should handle empty filters', () => {
      component.onFilterChanged({ genre: '', search: '' });
      expect(component.selectedGenre).toBe('');
      expect(component.searchText).toBe('');
    });

    it('should update filters multiple times', () => {
      component.onFilterChanged({ genre: 'FPS', search: 'Val' });
      expect(component.selectedGenre).toBe('FPS');

      component.onFilterChanged({ genre: 'MOBA', search: 'Dota' });
      expect(component.selectedGenre).toBe('MOBA');
      expect(component.searchText).toBe('Dota');
    });

    it('should set genre without search', () => {
      component.onFilterChanged({ genre: 'FPS', search: '' });
      expect(component.selectedGenre).toBe('FPS');
      expect(component.searchText).toBe('');
    });

    it('should set search without genre', () => {
      component.onFilterChanged({ genre: '', search: 'League' });
      expect(component.selectedGenre).toBe('');
      expect(component.searchText).toBe('League');
    });
  });

  describe('applyFiltersAndSort() Method - genre Filter', () => {
    beforeEach(() => {
      component.games = [...mockGames];
    });

    it('should filter games by genre (FPS)', () => {
      component.selectedGenre = 'FPS';
      component.searchText = '';
      component.applyFiltersAndSort();

      expect(component.filteredGames.length).toBe(3);
      expect(component.filteredGames.every((g) => g.Genre === 'FPS')).toBe(
        true
      );
    });

    it('should filter games by genre (MOBA)', () => {
      component.selectedGenre = 'MOBA';
      component.searchText = '';
      component.applyFiltersAndSort();

      expect(component.filteredGames.length).toBe(2);
      expect(component.filteredGames.every((g) => g.Genre === 'MOBA')).toBe(
        true
      );
    });

    it('should show all games when genre is empty', () => {
      component.selectedGenre = '';
      component.searchText = '';
      component.applyFiltersAndSort();

      expect(component.filteredGames.length).toBe(5);
    });

    it('should be case-insensitive for genre filtering', () => {
      component.selectedGenre = 'fps'; // lowercase
      component.searchText = '';
      component.applyFiltersAndSort();

      expect(component.filteredGames.length).toBe(3);
    });
  });

  describe('applyFiltersAndSort() Method - Search Filter', () => {
    beforeEach(() => {
      component.games = [...mockGames];
      component.selectedGenre = '';
    });

    it('should filter games by name prefix', () => {
      component.searchText = 'Counter';
      component.applyFiltersAndSort();

      expect(component.filteredGames.length).toBe(1);
      expect(component.filteredGames[0].Name).toBe('Counter-Strike 2');
    });

    it('should be case-insensitive for search', () => {
      component.searchText = 'counter'; // lowercase
      component.applyFiltersAndSort();

      expect(component.filteredGames.length).toBe(1);
      expect(component.filteredGames[0].Name).toBe('Counter-Strike 2');
    });

    it('should find games with partial name', () => {
      component.searchText = 'val';
      component.applyFiltersAndSort();

      expect(component.filteredGames.length).toBe(1);
      expect(component.filteredGames[0].Name).toBe('Valorant');
    });

    it('should not find games from middle of name', () => {
      component.searchText = 'Strike'; // keskellä nimeä
      component.applyFiltersAndSort();

      expect(component.filteredGames.length).toBe(0);
    });

    it('should return empty when no search results found', () => {
      component.searchText = 'NonExistentGame';
      component.applyFiltersAndSort();

      expect(component.filteredGames.length).toBe(0);
    });
  });

  describe('applyFiltersAndSort() Method - Combined Filters', () => {
    beforeEach(() => {
      component.games = [...mockGames];
    });

    it('should apply both genre and search filters', () => {
      component.selectedGenre = 'FPS';
      component.searchText = 'Val';
      component.applyFiltersAndSort();

      expect(component.filteredGames.length).toBe(1);
      expect(component.filteredGames[0].Name).toBe('Valorant');
    });

    it("should return empty when filters don't match", () => {
      component.selectedGenre = 'MOBA';
      component.searchText = 'Counter'; // Counter-Strike is FPS
      component.applyFiltersAndSort();

      expect(component.filteredGames.length).toBe(0);
    });

    it('should work when only genre is set', () => {
      component.selectedGenre = 'FPS';
      component.searchText = '';
      component.applyFiltersAndSort();

      expect(component.filteredGames.length).toBe(3);
    });

    it('should work when only search is set', () => {
      component.selectedGenre = '';
      component.searchText = 'League';
      component.applyFiltersAndSort();

      expect(component.filteredGames.length).toBe(1);
    });
  });

  describe('applyFiltersAndSort() Method - Sorting', () => {
    beforeEach(() => {
      component.games = [...mockGames];
      component.selectedGenre = '';
      component.searchText = '';
    });

    it('should sort games by popularity descending', () => {
      component.descending = true;
      component.applyFiltersAndSort();

      expect(component.filteredGames[0].Name).toBe('Counter-Strike 2'); // 100
      expect(component.filteredGames[1].Name).toBe('League of Legends'); // 95
      expect(component.filteredGames[4].Name).toBe('Apex Legends'); // 75
    });

    it('should sort games by popularity ascending', () => {
      component.descending = false;
      component.applyFiltersAndSort();

      expect(component.filteredGames[0].Name).toBe('Apex Legends'); // 75
      expect(component.filteredGames[1].Name).toBe('Dota 2'); // 80
      expect(component.filteredGames[4].Name).toBe('Counter-Strike 2'); // 100
    });

    it('should handle undefined Popularity values', () => {
      const gameWithoutPopularity = { ...mockGames[0] };
      delete (gameWithoutPopularity as any).Popularity;
      component.games = [gameWithoutPopularity, mockGames[1]];

      component.applyFiltersAndSort();

      // Should not crash
      expect(component.filteredGames.length).toBe(2);
    });
    it('should sort filtered games', () => {
      component.selectedGenre = 'FPS';
      component.descending = true;
      component.applyFiltersAndSort();

      expect(component.filteredGames[0].Name).toBe('Counter-Strike 2'); // 100
      expect(component.filteredGames[1].Name).toBe('Valorant'); // 85
      expect(component.filteredGames[2].Name).toBe('Apex Legends'); // 75
    });
  });

  describe('applyFiltersAndSort() Method - Edge Cases', () => {
    it('should handle empty games array', () => {
      component.games = [];
      component.applyFiltersAndSort();

      expect(component.filteredGames).toEqual([]);
    });

    it('should handle undefined Name', () => {
      const gameWithoutName = { ...mockGames[0], Name: undefined };
      component.games = [gameWithoutName];
      component.searchText = 'test';

      component.applyFiltersAndSort();

      expect(component.filteredGames.length).toBe(0);
    });

    it('should handle undefined Genre', () => {
      const gameWithoutGenre = { ...mockGames[0], Genre: undefined };
      component.games = [gameWithoutGenre];
      component.selectedGenre = 'FPS';

      component.applyFiltersAndSort();

      expect(component.filteredGames.length).toBe(0);
    });

    it('should create new array and not modify original', () => {
      component.games = [...mockGames];
      const originalLength = component.games.length;

      component.selectedGenre = 'FPS';
      component.applyFiltersAndSort();

      expect(component.games.length).toBe(originalLength);
      expect(component.filteredGames.length).toBeLessThan(originalLength);
    });
  });

  describe('Layout and Rendering', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should render layout div', () => {
      const layout = fixture.debugElement.query(By.css('.layout'));
      expect(layout).toBeTruthy();
    });

    it('should render mid-container', () => {
      const container = fixture.debugElement.query(By.css('.mid-container'));
      expect(container).toBeTruthy();
    });

    it('should render games-container', () => {
      const gamesContainer = fixture.debugElement.query(
        By.css('.games-container')
      );
      expect(gamesContainer).toBeTruthy();
    });

    it('should contain app-game-filters component', () => {
      const filters = fixture.debugElement.query(By.css('app-game-filters'));
      expect(filters).toBeTruthy();
    });
  });

  describe('Integration - Data Flow Between Components', () => {
    it('should pass filteredGames for display', () => {
      component.games = [...mockGames];
      component.applyFiltersAndSort();
      fixture.detectChanges();

      expect(component.filteredGames.length).toBeGreaterThan(0);
    });

    it('should update filteredGames when toggleSortOrder is called', () => {
      component.games = [...mockGames];
      component.descending = true;
      component.applyFiltersAndSort();
      const firstBefore = component.filteredGames[0];

      component.toggleSortOrder(); // switch to ascending
      const firstAfter = component.filteredGames[0];

      expect(firstBefore.Popularity).not.toEqual(firstAfter.Popularity);
    });

    it('should update filteredGames when onFilterChanged is called', () => {
      component.games = [...mockGames];
      component.applyFiltersAndSort();
      const countBefore = component.filteredGames.length;

      component.onFilterChanged({ genre: 'FPS', search: '' });
      const countAfter = component.filteredGames.length;

      expect(countAfter).toBeLessThan(countBefore);
    });

    it('should combine filters and sorting correctly', () => {
      component.games = [...mockGames];
      component.descending = true;
      component.onFilterChanged({ genre: 'FPS', search: '' });

      expect(component.filteredGames.length).toBe(3);
      expect(component.filteredGames[0].Name).toBe('Counter-Strike 2'); // highest popularity FPS
      expect(component.filteredGames[2].Name).toBe('Apex Legends'); // lowest popularity FPS
    });
  });

  describe('Pure Function - Complex Scenarios', () => {
    it('should handle consecutive filter changes', () => {
      component.games = [...mockGames];

      // Vaihe 1: genre filter
      component.onFilterChanged({ genre: 'FPS', search: '' });
      expect(component.filteredGames.length).toBe(3);

      // Vaihe 2: Lisätään search
      component.onFilterChanged({ genre: 'FPS', search: 'Val' });
      expect(component.filteredGames.length).toBe(1);
      expect(component.filteredGames[0].Name).toBe('Valorant');

      // Vaihe 3: Poistetaan genre
      component.onFilterChanged({ genre: '', search: 'Val' });
      expect(component.filteredGames.length).toBe(1);
      expect(component.filteredGames[0].Name).toBe('Valorant');
    });

    it('should work when all games are filtered out and added back', () => {
      component.games = [...mockGames];

      component.onFilterChanged({ genre: 'Strategy', search: '' });
      expect(component.filteredGames.length).toBe(0);

      component.onFilterChanged({ genre: '', search: '' });
      expect(component.filteredGames.length).toBe(5);
    });

    it('should maintain order when filters change', () => {
      component.games = [...mockGames];
      component.descending = false; // ascending

      component.onFilterChanged({ genre: 'FPS', search: '' });
      expect(component.filteredGames[0].Popularity).toBeLessThan(
        component.filteredGames[2].Popularity
      );

      component.toggleSortOrder(); // switch to descending
      expect(component.filteredGames[0].Popularity).toBeGreaterThan(
        component.filteredGames[2].Popularity
      );
    });
  });
});
