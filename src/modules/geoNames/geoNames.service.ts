import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import axios from 'axios';
import { Errors } from 'src/common/errors';

@Injectable()
export class GeoNamesService {
  private readonly UserName: string;

  constructor(private configService: ConfigService) {
    this.UserName = this.configService.get<string>('GEONAMES_USERNAME');
  }

  async getCitiesByState(adminCode: string): Promise<string[]> {
    try {
      const response = await axios.get('http://api.geonames.org/searchJSON', {
        params: {
          adminCode1: adminCode,
          country: 'CA',
          maxRows: 10,
          username: this.UserName,
          featureClass: 'P',
        },
      });

      if (response.data.geonames) {
        return response.data.geonames.map((city: any) => city.name);
      }

      return [];
    } catch (error) {
      throw new InternalServerErrorException(Errors.FAILED_TO_FETCH_CITIES);
    }
  }

  async getAllStatesInCanada(): Promise<{ name: string; adminCode: string }[]> {
    try {
      const response = await axios.get('http://api.geonames.org/searchJSON', {
        params: {
          country: 'CA',
          featureCode: 'ADM1',
          maxRows: 100,
          username: this.UserName,
        },
      });

      if (response.data.geonames) {
        return response.data.geonames.map((state: any) => ({
          name: state.name,
          adminCode: state.adminCode1,
        }));
      }

      return [];
    } catch (error) {
      throw new InternalServerErrorException(
        Errors.FAILED_TO_FETCH_STATES_CANADA,
      );
    }
  }

  async getAdminCodeByStateName(stateName: string): Promise<string | null> {
    try {
      const states = await this.getAllStatesInCanada();
      const state = states.find(
        (s) => s.name.toLowerCase() === stateName.toLowerCase(),
      );

      return state ? state.adminCode : null;
    } catch (error) {
      throw new InternalServerErrorException(Errors.FAILED_TO_FETCH_ADMIN_CODE);
    }
  }
}
