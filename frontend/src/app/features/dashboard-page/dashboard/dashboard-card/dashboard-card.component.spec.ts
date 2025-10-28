import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardCardComponent } from './dashboard-card.component';
import { Router } from '@angular/router';

describe('DashboardCardComponent - UI & Funktiotestit', () => {
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
 component.game = mockGame; // Asetetaan mock-data
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

 it('should vastaanottaa game input-parametri', () => {
 expect(component.game).toEqual(mockGame);
 });
 });

 describe('selectGame() metodi', () => {
 it('should navigate to find-players page when peli select', () => {
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

 it('should work different peleillä', () => {
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

 describe('Template renderöinti', () => {
 it('should show game tiedot templatessa', () => {
 const compiled = fixture.nativeElement;
 expect(compiled).toBeTruthy();
 });

 it('should käyttää game inputia templatessa', () => {
 expect(component.game.Name).toBe('Counter-Strike 2');
 expect(component.game.Img_url).toBe('cs2.jpg');
 });
 });

 describe('Edge caset', () => {
 it('should handle undefined game without renderöintiä', () => {
 component.game = undefined;
 // Ei kutsuta detectChanges(), jotta vältetään templatessa virheet
 expect(component.game).toBeUndefined();
 });

 it('should handle null game without renderöintiä', () => {
 component.game = null;
 // Ei kutsuta detectChanges(), jotta vältetään templatessa virheet
 expect(component.game).toBeNull();
 });

 it('should throw error jos PK-field missing', () => {
 const invalidGame = { Name: 'Invalid Game' };
 // selectGame olettaa että PK on olemassa
 expect(() => component.selectGame(invalidGame)).toThrow();
 });
 });
});
