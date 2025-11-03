import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { By } from '@angular/platform-browser';

import { GameCardComponent } from './game-card.component';
import { Game } from '../../../core/interfaces/game.model';

describe('GameCardComponent - UI & Navigation Tests', () => {
  let component: GameCardComponent;
  let fixture: ComponentFixture<GameCardComponent>;
  let router: Router;

  const mockGame: Game = {
    PK: 'GAME#1',
    SK: 'DETAILS',
    Name: 'Counter-Strike 2',
    Img_url: 'https://example.com/cs2.jpg',
    Popularity: 100,
    Genre: 'FPS',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameCardComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GameCardComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);

    // Set required input
    component.game = mockGame;

    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should require game input', () => {
      expect(component.game).toBeDefined();
    });

    it('should store game input correctly', () => {
      expect(component.game.PK).toBe('GAME#1');
      expect(component.game.Name).toBe('Counter-Strike 2');
      expect(component.game.Popularity).toBe(100);
    });
  });

  describe('selectGame() - Navigation Logic', () => {
    it('should navigate to find-players page', () => {
      const navigateSpy = jest.spyOn(router, 'navigate');

      component.selectGame(mockGame);

      expect(navigateSpy).toHaveBeenCalledWith(
        ['dashboard/find-players'],
        expect.objectContaining({
          queryParams: { game: '1' },
        })
      );
    });

    it('should remove "GAME#" prefix from PK', () => {
      const navigateSpy = jest.spyOn(router, 'navigate');

      component.selectGame(mockGame);

      const callArgs = navigateSpy.mock.calls[0];
      expect(callArgs[1]?.queryParams?.['game']).toBe('1');
      expect(callArgs[1]?.queryParams?.['game']).not.toContain('GAME#');
    });

    it('should work with different game PK', () => {
      const navigateSpy = jest.spyOn(router, 'navigate');
      const anotherGame = { ...mockGame, PK: 'GAME#42' };

      component.selectGame(anotherGame);

      expect(navigateSpy).toHaveBeenCalledWith(
        ['dashboard/find-players'],
        expect.objectContaining({
          queryParams: { game: '42' },
        })
      );
    });

    it('should handle long game ID', () => {
      const navigateSpy = jest.spyOn(router, 'navigate');
      const gameWithLongId = {
        ...mockGame,
        PK: 'GAME#a5bec358-5bd7-443b-9d5d-c33f9c198329',
      };

      component.selectGame(gameWithLongId);

      expect(navigateSpy).toHaveBeenCalledWith(
        ['dashboard/find-players'],
        expect.objectContaining({
          queryParams: { game: 'a5bec358-5bd7-443b-9d5d-c33f9c198329' },
        })
      );
    });

    it('should work even if game is any type', () => {
      const navigateSpy = jest.spyOn(router, 'navigate');
      const anyGame: any = { PK: 'GAME#test123', Name: 'Test' };

      component.selectGame(anyGame);

      expect(navigateSpy).toHaveBeenCalledWith(
        ['dashboard/find-players'],
        expect.objectContaining({
          queryParams: { game: 'test123' },
        })
      );
    });
  });

  describe('UI Rendering', () => {
    it('should render card element', () => {
      const card = fixture.debugElement.query(By.css('.card'));
      expect(card).toBeTruthy();
    });

    it('should show game name', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('Counter-Strike 2');
    });

    it('should render game image', () => {
      const img = fixture.debugElement.query(By.css('img'));
      expect(img).toBeTruthy();
      expect(img.nativeElement.src).toContain('cs2.jpg');
    });

    it('should set alt text for image', () => {
      const img = fixture.debugElement.query(By.css('img'));
      expect(img.nativeElement.alt).toBe('Game picture');
    });

    it('should show game Genre', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('Genre:');
      expect(compiled.textContent).toContain('FPS');
    });
  });

  describe('input Property Tests', () => {
    it('should update view when game changes', () => {
      const newGame: Game = {
        PK: 'GAME#2',
        SK: 'DETAILS',
        Name: 'Valorant',
        Img_url: 'https://example.com/valorant.jpg',
        Popularity: 85,
        Genre: 'FPS',
      };

      component.game = newGame;
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('Valorant');
    });

    it('should work without genre field', () => {
      const gameWithoutGenre: Game = {
        PK: 'GAME#3',
        SK: 'DETAILS',
        Name: 'Test Game',
        Img_url: 'https://example.com/test.jpg',
        Popularity: 50,
      };

      component.game = gameWithoutGenre;
      fixture.detectChanges();

      expect(component).toBeTruthy();
    });

    it('should work without Img_url field', () => {
      const gameWithoutImage: Game = {
        PK: 'GAME#4',
        SK: 'DETAILS',
        Name: 'Test Game',
        Popularity: 50,
      };

      component.game = gameWithoutImage;
      fixture.detectChanges();

      expect(component).toBeTruthy();
    });

    it('should handle 0 popularity', () => {
      const gameWithZeroPopularity: Game = {
        PK: 'GAME#5',
        SK: 'DETAILS',
        Name: 'Unpopular Game',
        Img_url: 'https://example.com/unpopular.jpg',
        Popularity: 0,
      };

      component.game = gameWithZeroPopularity;
      fixture.detectChanges();

      expect(component.game.Popularity).toBe(0);
    });
  });

  describe('Click Interaction', () => {
    it('should call selectGame when card is clicked', () => {
      const selectGameSpy = jest.spyOn(component, 'selectGame');
      const card = fixture.debugElement.query(By.css('.card'));

      card.nativeElement.click();

      expect(selectGameSpy).toHaveBeenCalled();
    });
  });
});
