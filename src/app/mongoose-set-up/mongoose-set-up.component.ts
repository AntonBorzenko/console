import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MongooseSetupTab } from './mongoose-setup-tab.model';

@Component({
  selector: 'app-mongoose-set-up',
  templateUrl: './mongoose-set-up.component.html',
  styleUrls: ['./mongoose-set-up.component.css']
})

export class MongooseSetUpComponent implements OnInit {

  readonly BASE_URL = "/setup";

  setUpTabs: MongooseSetupTab[] = []
  
  currentStepNumber: number = 0;

  constructor(private router: Router) {
    this.initSetUpTabs();
   }

  // MARK: - Lifecycle 

  ngOnInit() {
    this.router.navigate([this.BASE_URL, this.setUpTabs[this.currentStepNumber].contentLink]);
  }

  // MARK: - Public 

  getCurrentStepName(): string { 
    return this.setUpTabs[this.currentStepNumber].title;
  }

  getPercentagePerTab(): number { 
    let rawPercentage = (100 / this.setUpTabs.length);
    // NOTE: tabs offset is an estimated value. 
    let tabsOffset = this.setUpTabs.length;
    return Math.round(rawPercentage) - tabsOffset;
  }

  onNextStepClicked() { 
    this.setUpTabs[this.currentStepNumber].isCompleted = true; 
    this.currentStepNumber++; 
    this.router.navigate([this.BASE_URL, this.setUpTabs[this.currentStepNumber].contentLink]);
  }

  // MARK: - Private

  private initSetUpTabs() { 
    this.setUpTabs.push(new MongooseSetupTab("Nodes", "nodes"));
    this.setUpTabs.push(new MongooseSetupTab("Configuration", "editing-scenarios"));
    this.setUpTabs.push(new MongooseSetupTab("Scenario", "control"));
  }

}
