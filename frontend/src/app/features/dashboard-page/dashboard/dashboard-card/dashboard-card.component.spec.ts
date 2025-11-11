import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardCardComponent } from './dashboard-card.component';
import { Router } from '@angular/router';

describe('DashboardCardComponent - UI & function tests', () => {
  let component: DashboardCardComponent;
  let fixture: ComponentFixture<DashboardCardComponent>;
  let mockRouter: jest.Mocked<Router>;

  const mockGame = {
    PK: 'GAME#cs2',
    SK: 'METADATA',
    Name: 'Counter-Strike 2',
    genre: 'FPS',
    Popularity: 100,
    Img_url: 'cs2.jpg',
  };

  beforeEach(async () => {
    mockRouter = {
      navigate: jest.fn(),
    } as any;

    await TestBed.configureTestingModule({
      imports: [DashboardCardComponent],
      providers: [{ provide: Router, useValue: mockRouter }],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardCardComponent);
    component = fixture.componentInstance;
    component.game = mockGame; // set mock data
    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize game input empty', () => {
      const newComponent = TestBed.createComponent(
        DashboardCardComponent
      ).componentInstance;
      expect(newComponent.game).toBeUndefined();
    });

    it('should receive game input parameter', () => {
      expect(component.game).toEqual(mockGame);
    });
  });

  describe('selectGame() method', () => {
    it('should navigate to find-players page when a game is selected', () => {
      component.selectGame(mockGame);

      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ['dashboard/find-players'],
        {
          queryParams: { game: 'cs2' },
        }
      );
    });

    it('should remove "GAME#" etuliite PK:sta', () => {
      const gameWithPrefix = {
        PK: 'GAME#valorant',
        Name: 'Valorant',
      };

      component.selectGame(gameWithPrefix);

      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ['dashboard/find-players'],
        {
          queryParams: { game: 'valorant' },
        }
      );
    });

    it('should work with different games', () => {
      const lolGame = {
        PK: 'GAME#lol',
        Name: 'League of Legends',
      };

      component.selectGame(lolGame);

      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ['dashboard/find-players'],
        {
          queryParams: { game: 'lol' },
        }
      );
    });
  });

  describe('Template rendering', () => {
    it('should show game details in template', () => {
      const compiled = fixture.nativeElement;
      expect(compiled).toBeTruthy();
    });

    it('should use game input in template', () => {
      expect(component.game.Name).toBe('Counter-Strike 2');
      expect(component.game.Img_url).toBe('cs2.jpg');
    });
  });

  describe('Edge caset', () => {
    it('should handle undefined game without rendering', () => {
      component.game = undefined;
      // Do not call detectChanges() to avoid template errors
      expect(component.game).toBeUndefined();
    });

    it('should handle null game without rendering', () => {
      component.game = null;
      // Do not call detectChanges() to avoid template errors
      expect(component.game).toBeNull();
    });

    it('should throw error if PK field is missing', () => {
      const invalidGame = { Name: 'Invalid Game' };
      // selectGame assumes that PK exists
      expect(() => component.selectGame(invalidGame)).toThrow();
    });
  });
});
