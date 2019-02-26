import { MongooseRunRecord } from "src/app/core/models/run-record.model";
import { MonitoringApiService } from "src/app/core/services/monitoring-api/monitoring-api.service";
import { MongooseRunStatus } from "src/app/core/mongoose-run-status";

export class MongooseRunTab { 

    public tabTitle: string;
    public records: MongooseRunRecord[];
    public isSelected: boolean = false; 

    constructor(private monitoringApiService: MonitoringApiService, status: string) { 
        this.records = this.filterRunRecordsByStatus(status);
        this.tabTitle = status;
    }

    // MARK: - Public

    // NOTE: Tab Tag format is: " *tab title* (*amount of matching tabs*) "
    getTabTag(): string { 
        let elementsAmountTag = "(" + this.records.length + ")";
        let delimiter = " ";
        return (this.tabTitle + delimiter + elementsAmountTag); 
    }

    // MARK: - Private 

    private filterRunRecordsByStatus(requiredStatus: string): MongooseRunRecord[] {
        if (requiredStatus.toString() == MongooseRunStatus.All) { 
            return this.monitoringApiService.getMongooseRunRecords();
          }
          // NOTE: Iterating over existing tabs, filtring them by 'status' property.
          var requiredRecords: MongooseRunRecord[] = [];
          for (var runRecord of this.monitoringApiService.getMongooseRunRecords()) { 
            if (runRecord.status == requiredStatus) { 
                requiredRecords.push(runRecord);
            }
        }
        return requiredRecords;
    }

}