import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { GameFiltersComponent } from './game-filters.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';

describe('GameFiltersComponent - UI & State Management', () => {
  let component: GameFiltersComponent;
  let fixture: ComponentFixture<GameFiltersComponent>;

  // Helper function to create mock select event
  const createSelectEvent = (value: string): Partial<Event> => ({
    target: { value } as HTMLSelectElement,
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameFiltersComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GameFiltersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize selectedGenre as empty', () => {
      expect(component.selectedGenre).toBe('');
    });

    it('should initialize sortByPopularity to false', () => {
      expect(component.sortByPopularity).toBe(false);
    });

    it('should initialize searchControl with empty value', () => {
      expect(component.searchControl.value).toBe('');
    });

    it('should create FormControl', () => {
      expect(component.searchControl).toBeDefined();
    });
  });

  describe('onGenreChange() - State Management', () => {
    it('should update selectedGenre when genre is selected', () => {
      const mockEvent = {
        target: { value: 'FPS' } as HTMLSelectElement,
      } as any;

      component.onGenreChange(mockEvent);

      expect(component.selectedGenre).toBe('FPS');
    });

    it('should handle genre MOBA', () => {
      const mockEvent = {
        target: { value: 'MOBA' } as HTMLSelectElement,
      } as any;

      component.onGenreChange(mockEvent);

      expect(component.selectedGenre).toBe('MOBA');
    });

    it('should handle empty genre (all games)', () => {
      const mockEvent = {
        target: { value: '' } as HTMLSelectElement,
      } as any;

      component.onGenreChange(mockEvent);

      expect(component.selectedGenre).toBe('');
    });

    it('should emit filterChanged event with correct values', (done) => {
      component.filterChanged.subscribe((filters) => {
        expect(filters.genre).toBe('FPS');
        expect(filters.search).toBe('');
        expect(filters.sortByPopularity).toBe(false);
        done();
      });

      const mockEvent = {
        target: { value: 'FPS' } as HTMLSelectElement,
      } as any;

      component.onGenreChange(mockEvent);
    });

    it('should update genre multiple times', () => {
      let mockEvent = {
        target: { value: 'FPS' } as HTMLSelectElement,
      } as any;
      component.onGenreChange(mockEvent);
      expect(component.selectedGenre).toBe('FPS');

      mockEvent = {
        target: { value: 'MOBA' } as HTMLSelectElement,
      } as any;
      component.onGenreChange(mockEvent);
      expect(component.selectedGenre).toBe('MOBA');
    });

    it('should not crash when target is null', () => {
      const mockEvent = {
        target: null,
      } as any;

      expect(() => component.onGenreChange(mockEvent)).not.toThrow();
    });
  });

  describe('onToggleSort() - State Management', () => {
    it('should toggle sortByPopularity from false to true', () => {
      component.sortByPopularity = false;
      component.onToggleSort();

      expect(component.sortByPopularity).toBe(true);
    });

    it('should toggle sortByPopularity from true to false', () => {
      component.sortByPopularity = true;
      component.onToggleSort();

      expect(component.sortByPopularity).toBe(false);
    });

    it('should work with multiple consecutive calls', () => {
      component.sortByPopularity = false;
      component.onToggleSort(); // -> true
      expect(component.sortByPopularity).toBe(true);

      component.onToggleSort(); // -> false
      expect(component.sortByPopularity).toBe(false);

      component.onToggleSort(); // -> true
      expect(component.sortByPopularity).toBe(true);
    });

    it('should emit sortToggled event', (done) => {
      component.sortToggled.subscribe(() => {
        done();
      });

      component.onToggleSort();
    });

    it('should emit filterChanged event with sortByPopularity value', (done) => {
      component.sortByPopularity = false;

      component.filterChanged.subscribe((filters) => {
        expect(filters.sortByPopularity).toBe(true);
        done();
      });

      component.onToggleSort();
    });
  });

  describe('searchControl - Reactive Forms with Debounce', () => {
    it('should emit filterChanged event when search text changes', fakeAsync(() => {
      let emittedFilters: any;

      component.filterChanged.subscribe((filters) => {
        emittedFilters = filters;
      });

      component.searchControl.setValue('Counter');
      tick(500); // Wait for debounce

      expect(emittedFilters.search).toBe('Counter');
    }));

    it('should debounce 500ms before emitting', fakeAsync(() => {
      let emitCount = 0;

      component.filterChanged.subscribe(() => {
        emitCount++;
      });

      component.searchControl.setValue('C');
      tick(200);
      component.searchControl.setValue('Co');
      tick(200);
      component.searchControl.setValue('Cou');
      tick(500);

      // Only one emit after debounce
      expect(emitCount).toBe(1);
    }));

    it("should not emit when value doesn't change (distinctUntilChanged)", fakeAsync(() => {
      let emitCount = 0;

      component.filterChanged.subscribe(() => {
        emitCount++;
      });

      component.searchControl.setValue('Counter');
      tick(500);
      expect(emitCount).toBe(1);

      component.searchControl.setValue('Counter'); // same value
      tick(500);
      expect(emitCount).toBe(1); // no new emit
    }));

    it('should emit when value changes', fakeAsync(() => {
      let emitCount = 0;

      component.filterChanged.subscribe(() => {
        emitCount++;
      });

      component.searchControl.setValue('Counter');
      tick(500);
      expect(emitCount).toBe(1);

      component.searchControl.setValue('Valorant');
      tick(500);
      expect(emitCount).toBe(2); // new emit
    }));

    it('should handle empty search text', fakeAsync(() => {
      let emittedFilters: any;

      component.filterChanged.subscribe((filters) => {
        emittedFilters = filters;
      });

      component.searchControl.setValue('');
      tick(500);

      expect(emittedFilters.search).toBe('');
    }));

    it('should handle null value', fakeAsync(() => {
      let emittedFilters: any;

      component.filterChanged.subscribe((filters) => {
        emittedFilters = filters;
      });

      component.searchControl.setValue(null);
      tick(500);

      expect(emittedFilters.search).toBe('');
    }));
  });

  describe('emitFilters() - Pure Function Logic', () => {
    it('should emit all filters together', (done) => {
      component.selectedGenre = 'FPS';
      component.searchControl.setValue('Counter');
      component.sortByPopularity = false; // will toggle to true

      component.filterChanged.subscribe((filters) => {
        expect(filters.genre).toBe('FPS');
        expect(filters.search).toBe('Counter');
        expect(filters.sortByPopularity).toBe(true);
        done();
      });

      component.onToggleSort(); // toggles to true and triggers emit
    });

    it('should emit correct values when only genre on asetettu', (done) => {
      component.selectedGenre = 'MOBA';

      component.filterChanged.subscribe((filters) => {
        expect(filters.genre).toBe('MOBA');
        expect(filters.search).toBe('');
        expect(filters.sortByPopularity).toBe(false);
        done();
      });

      const mockEvent = {
        target: { value: 'MOBA' } as HTMLSelectElement,
      } as any;
      component.onGenreChange(mockEvent);
    });

    it('should emit correct values when all filters on tyhjinä', (done) => {
      component.filterChanged.subscribe((filters) => {
        expect(filters.genre).toBe('');
        expect(filters.search).toBe('');
        expect(filters.sortByPopularity).toBe(false);
        done();
      });

      const mockEvent = {
        target: { value: '' } as HTMLSelectElement,
      } as any;
      component.onGenreChange(mockEvent);
    });
  });

  describe('UI Rendering', () => {
    it('should render genre select dropdown', () => {
      const select = fixture.debugElement.query(By.css('select'));
      expect(select).toBeTruthy();
    });

    it('should render search input', () => {
      const input = fixture.debugElement.query(By.css('input[type="text"]'));
      expect(input).toBeTruthy();
    });

    it('should render sort button', () => {
      const button = fixture.debugElement.query(By.directive(ButtonComponent));
      expect(button).toBeTruthy();
    });

    it('should render select element joka update selectedGenre', () => {
      const select = fixture.debugElement.query(By.css('select'));
      expect(select).toBeTruthy();

      // Test state change through method
      component.onGenreChange(createSelectEvent('FPS') as any);
      expect(component.selectedGenre).toBe('FPS');
    });

    it('should update searchControl when input change', () => {
      const input = fixture.debugElement.query(By.css('input[type="text"]'));
      const inputElement = input.nativeElement;

      inputElement.value = 'Counter';
      inputElement.dispatchEvent(new Event('input'));

      expect(component.searchControl.value).toBe('Counter');
    });

    it('should togglettaa sortByPopularity when button klikataan', () => {
      const button = fixture.debugElement.query(By.directive(ButtonComponent));

      component.sortByPopularity = false;
      button.triggerEventHandler('click', new Event('click'));

      expect(component.sortByPopularity).toBe(true);
    });
  });

  describe('Integration - Complex Filter Scenarios', () => {
    it('should handle genre + search together', fakeAsync(() => {
      let emittedFilters: any;

      component.filterChanged.subscribe((filters) => {
        emittedFilters = filters;
      });

      // Set genre
      const mockEvent = {
        target: { value: 'FPS' } as HTMLSelectElement,
      } as any;
      component.onGenreChange(mockEvent);

      // Set search
      component.searchControl.setValue('Counter');
      tick(500);

      expect(emittedFilters.genre).toBe('FPS');
      expect(emittedFilters.search).toBe('Counter');
    }));

    it('should handle all filters together', fakeAsync(() => {
      let emittedFilters: any;

      component.filterChanged.subscribe((filters) => {
        emittedFilters = filters;
      });

      // Set genre
      const mockEvent = {
        target: { value: 'MOBA' } as HTMLSelectElement,
      } as any;
      component.onGenreChange(mockEvent);

      // Set search
      component.searchControl.setValue('League');
      tick(500);

      // Toggle sort
      component.onToggleSort();

      expect(emittedFilters.genre).toBe('MOBA');
      expect(emittedFilters.search).toBe('League');
      expect(emittedFilters.sortByPopularity).toBe(true);
    }));

    it('should reset filters', fakeAsync(() => {
      let emittedFilters: any;

      component.filterChanged.subscribe((filters) => {
        emittedFilters = filters;
      });

      // Set all filters
      component.selectedGenre = 'FPS';
      component.searchControl.setValue('Counter');
      component.sortByPopularity = true;

      // Reset
      const mockEvent = {
        target: { value: '' } as HTMLSelectElement,
      } as any;
      component.onGenreChange(mockEvent);

      component.searchControl.setValue('');
      tick(500);

      component.onToggleSort();

      expect(emittedFilters.genre).toBe('');
      expect(emittedFilters.search).toBe('');
      expect(emittedFilters.sortByPopularity).toBe(false);
    }));
  });
});
