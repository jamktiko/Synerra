import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';
import { Game } from '../../../core/interfaces/game.model';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('DashboardComponent - Puhdas Yksikkötestaus (No Mocks)', () => {
 let component: DashboardComponent;
 let fixture: ComponentFixture<DashboardComponent>;

 beforeEach(async () => {
 await TestBed.configureTestingModule({
 imports: [DashboardComponent],
 providers: [provideHttpClient(), provideHttpClientTesting()],
 schemas: [NO_ERRORS_SCHEMA],
 }).compileComponents();

 fixture = TestBed.createComponent(DashboardComponent);
 component = fixture.componentInstance;
 });

 describe('Component Initialization', () => {
 it('should create', () => {
 expect(component).toBeTruthy();
 });

 it('should initialize games as empty array', () => {
 expect(component.games).toEqual([]);
 });

 it('should initialize sortedGames empty array', () => {
 expect(component.sortedGames).toEqual([]);
 });

 it('should initialize filteredGames as empty array', () => {
 expect(component.filteredGames).toEqual([]);
 });

 it('should initialize userGames empty array', () => {
 expect(component.userGames).toEqual([]);
 });

 it('should initialize me to null', () => {
 expect(component.me).toBeNull();
 });
 });

 describe('filterUserGames() - Suodatuslogiikka', () => {
 beforeEach(() => {
 // Asetetaan sortedGames suoraan componentin
 component.sortedGames = [
 {
 PK: 'GAME#cs2',
 SK: 'METADATA',
 Name: 'Counter-Strike 2',
 genre: 'FPS',
 Popularity: 100,
 Img_url: 'cs2.jpg',
 } as Game,
 {
 PK: 'GAME#lol',
 SK: 'METADATA',
 Name: 'League of Legends',
 genre: 'MOBA',
 Popularity: 95,
 Img_url: 'lol.jpg',
 } as Game,
 {
 PK: 'GAME#valorant',
 SK: 'METADATA',
 Name: 'Valorant',
 genre: 'FPS',
 Popularity: 85,
 Img_url: 'valorant.jpg',
 } as Game,
 ];
 });

 it('should filter game user pelien by', () => {
 component.userGames = [
 { gameId: 'cs2', gameName: 'Counter-Strike 2' },
 { gameId: 'valorant', gameName: 'Valorant' },
 ];

 component.filterUserGames();

 expect(component.filteredGames.length).toBe(2);
 expect(component.filteredGames[0].Name).toBe('Counter-Strike 2');
 expect(component.filteredGames[1].Name).toBe('Valorant');
 });

 it('should return empty array when user ei ole game', () => {
 component.userGames = [];

 component.filterUserGames();

 expect(component.filteredGames).toEqual([]);
 });

 it('should handle GAME# prefix poisto PK:sta', () => {
 component.userGames = [{ gameId: 'cs2', gameName: 'Counter-Strike 2' }];

 component.filterUserGames();

 expect(component.filteredGames.length).toBe(1);
 expect(component.filteredGames[0].PK).toBe('GAME#cs2');
 });

 it('should sort filtered games Popularity by', () => {
 component.userGames = [
 { gameId: 'valorant', gameName: 'Valorant' }, // 85
 { gameId: 'cs2', gameName: 'Counter-Strike 2' }, // 100
 ];

 component.filterUserGames();

 expect(component.filteredGames[0].Name).toBe('Counter-Strike 2'); // 100
 expect(component.filteredGames[1].Name).toBe('Valorant'); // 85
 });

 it('should handle situation when peli ei find sortedGames:sta', () => {
 component.userGames = [
 { gameId: 'nonexistent', gameName: 'Non-existent Game' },
 ];

 component.filterUserGames();

 expect(component.filteredGames.length).toBe(0);
 });

 it('should work when userGames on empty', () => {
 component.userGames = [];

 component.filterUserGames();

 expect(component.filteredGames).toEqual([]);
 });
 });

 describe('Järjestämislogiikka - Pure Function Testing', () => {
 it('should sort numeric Popularity values correctly', () => {
 const games: Game[] = [
 {
 PK: 'GAME#game1',
 SK: 'METADATA',
 Name: 'Game 1',
 genre: 'Action',
 Popularity: 10,
 Img_url: 'g1.jpg',
 } as Game,
 {
 PK: 'GAME#game2',
 SK: 'METADATA',
 Name: 'Game 2',
 genre: 'RPG',
 Popularity: 100,
 Img_url: 'g2.jpg',
 } as Game,
 {
 PK: 'GAME#game3',
 SK: 'METADATA',
 Name: 'Game 3',
 genre: 'Strategy',
 Popularity: 50,
 Img_url: 'g3.jpg',
 } as Game,
 ];

 const sorted = [...games].sort((a, b) => b.Popularity - a.Popularity);

 expect(sorted[0].Popularity).toBe(100);
 expect(sorted[1].Popularity).toBe(50);
 expect(sorted[2].Popularity).toBe(10);
 });

 it('should handle negatiiviset Popularity values suodatuksessa', () => {
 const games: Game[] = [
 {
 PK: 'GAME#game1',
 SK: 'METADATA',
 Name: 'Game 1',
 genre: 'Action',
 Popularity: -5,
 Img_url: 'g1.jpg',
 } as Game,
 {
 PK: 'GAME#game2',
 SK: 'METADATA',
 Name: 'Game 2',
 genre: 'RPG',
 Popularity: 10,
 Img_url: 'g2.jpg',
 } as Game,
 ];

 const filtered = games.filter((g) => g.Popularity >= 1);

 expect(filtered.length).toBe(1);
 expect(filtered[0].Popularity).toBe(10);
 });

 it('should handle same Popularity -values', () => {
 const games: Game[] = [
 {
 PK: 'GAME#game1',
 SK: 'METADATA',
 Name: 'Game 1',
 genre: 'Action',
 Popularity: 50,
 Img_url: 'g1.jpg',
 } as Game,
 {
 PK: 'GAME#game2',
 SK: 'METADATA',
 Name: 'Game 2',
 genre: 'RPG',
 Popularity: 50,
 Img_url: 'g2.jpg',
 } as Game,
 ];

 const sorted = [...games].sort((a, b) => b.Popularity - a.Popularity);

 expect(sorted.length).toBe(2);
 expect(sorted[0].Popularity).toBe(50);
 expect(sorted[1].Popularity).toBe(50);
 });
 });
});
