import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Textbox } from './textbox';

describe('Textbox', () => {
  let component: Textbox;
  let fixture: ComponentFixture<Textbox>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Textbox],
    }).compileComponents();

    fixture = TestBed.createComponent(Textbox);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
