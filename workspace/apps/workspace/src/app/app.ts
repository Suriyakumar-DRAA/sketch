import { Component } from '@angular/core';
import { RouterModule } from '@angular/router'; 
import { Textbox } from '@org/sketch/textbox'
import { Dropdown } from '@org/sketch/dropdown'

@Component({
  imports: [ RouterModule, Textbox, Dropdown],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected title = 'workspace';
}
