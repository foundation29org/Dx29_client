import { Injectable } from '@angular/core';
import _ from 'lodash';
import { HttpClient } from '@angular/common/http';
import * as faker from 'faker';

@Injectable()

export class PatientEmbeddingService {

  private condition = [];
      private patients = [];

      constructor(private http: HttpClient) {
          // this.fetchPatients();
          this._generateData();
      }

      getSimilarPatients(codes: string[]) {
          if (codes && codes.length > 0) {
              const hpoQS = codes.join(',');
              const APICode = '6VfnJBGT14qGXme1sUouLERAfmQsV8aIrVaJnDRnlyWZn6iUJo/V4Q==';
              const apiUrl = `https://h29patientmap.azurewebsites.net/api/EmbedSymptomAndGetNearestPatients?code=${APICode}&symptoms=${hpoQS}&patientsperdisease=20`;
              return this.http.get(apiUrl);
          }
          return null;
      }

      getDataset() {
          return {
              conditions: this.condition,
              patients: this.patients
          };
      }

      getPatient2DEmbedding(symptoms) {
          return [Math.random(), Math.random()];
      }

      getNearestConditions(embeddingCoordinate, maxCount = 5) {
          return this.condition.sort((ca, cb) => {
              const distConditionAToCoordinate = this._distance(ca.embedding, embeddingCoordinate);
              const distConditionBToCoordinate = this._distance(cb.embedding, embeddingCoordinate);
              return (distConditionAToCoordinate - distConditionBToCoordinate);
          }).splice(0, maxCount);
      }

      getRelatedPatients(condition) {
          return this.patients.filter(p => condition.id == p.conditionId);
      }

      _distance(coordA, coordB) {
          return Math.sqrt(Math.pow(coordA[0] - coordB[0], 2) + Math.pow(coordA[1] - coordB[1], 2));
      }

      _generateData() {
          const MAX_CONDITIONS = 3000;
          const MAX_PATIENTS_PER_CONDITION = 100;
          this.condition = new Array(MAX_CONDITIONS);
          for (let i = 0; i < MAX_CONDITIONS; i++) {
              const rndConditionEmbedding = [Math.random(), Math.random()];
              const totalPatientsForCondition = (MAX_PATIENTS_PER_CONDITION - Math.random() * 20);
              for (let j = 0; j < totalPatientsForCondition; j++) {
                  this.patients.push({
                      name: faker.name.findName(),
                      conditionId: i,
                      embedding: [
                          rndConditionEmbedding[0] + (Math.random() / 10 - 0.05),
                          rndConditionEmbedding[1] + (Math.random() / 10 - 0.05)
                      ]
                  });
              }
              this.condition[i] = {
                  id: i,
                  name: faker.lorem.words(Math.floor(Math.random() * 2 + 1)),
                  embedding: rndConditionEmbedding
              };
          }
      }

      _generateData2() {

      }

}
