import { Component } from '@angular/core';
import { RouterModule } from '@angular/router'; 
import { TextboxComponent } from '@org/sketch/textbox'
import { Dropdown } from '@org/sketch/dropdown'

@Component({
  imports: [ RouterModule, TextboxComponent, Dropdown],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected title = 'workspace';
}
