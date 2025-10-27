import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { BirthdayComponent } from './birthday.component';

describe('BirthdayComponent', () => {
 let component: BirthdayComponent;
 let fixture: ComponentFixture<BirthdayComponent>;

 beforeEach(async () => {
 await TestBed.configureTestingModule({
 imports: [BirthdayComponent],
 providers: [
 provideHttpClient(),
 provideHttpClientTesting(),
 NgbActiveModal,
 ],
 }).compileComponents();

 fixture = TestBed.createComponent(BirthdayComponent);
 component = fixture.componentInstance;
 fixture.detectChanges();
 });

 it('should create', () => {
 expect(component).toBeTruthy();
 });
});
