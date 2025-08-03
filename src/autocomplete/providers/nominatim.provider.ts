import { BadGatewayException, Injectable } from '@nestjs/common'
import { AutocompleteProvider } from './autocomplete-provider.interface'
import { AutocompleteQueryDto } from '../dto/autocomplete-query.dto'
import { AutocompleteResultDto } from '../dto/autocomplete-result.dto'
import axios from 'axios'
import {
    DEFAULT_AUTOCOMPLETE_LANGUAGE,
    DEFAULT_AUTOCOMPLETE_COUNTRY,
    AUTOCOMPLETE_ADDRESS_DETAILS,
    AUTOCOMPLETE_DEFAULT_LIMIT,
} from '../constants/autocomplete.constants'
import { NominatimResult } from './types/nominatim-result.interface'

@Injectable()
export class NominatimProvider implements AutocompleteProvider {
    async search(dto: AutocompleteQueryDto): Promise<AutocompleteResultDto[]> {
        const params = {
            q: dto.q,
            format: 'json',
            addressdetails: AUTOCOMPLETE_ADDRESS_DETAILS,
            limit: dto.limit ?? AUTOCOMPLETE_DEFAULT_LIMIT,
            countrycodes: DEFAULT_AUTOCOMPLETE_COUNTRY.toLowerCase(),
            'accept-language': dto.language ?? DEFAULT_AUTOCOMPLETE_LANGUAGE,
        }

        try {
            const response = await axios.get<NominatimResult[]>('https://nominatim.openstreetmap.org/search', {
                params,
                headers: {
                    'User-Agent': process.env.AUTOCOMPLETE_USER_AGENT,
                },
            })

            return response.data.map((item: any): AutocompleteResultDto => ({
                name: item.display_name,
                address: [
                    item.address?.road,
                    item.address?.city || item.address?.town || item.address?.village,
                    item.address?.country,
                ].filter(Boolean).join(', '),
                lat: parseFloat(item.lat),
                lon: parseFloat(item.lon),
                source: 'nominatim',
            }))
        } catch (error) {
            throw new BadGatewayException('Nominatim provider error')
        }
    }
}