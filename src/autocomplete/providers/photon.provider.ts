import axios from 'axios'
import { AutocompleteQueryDto } from '../dto/autocomplete-query.dto'
import { AutocompleteProvider } from './autocomplete-provider.interface'
import { AutocompleteResultDto } from '../dto/autocomplete-result.dto'
import { BadGatewayException, Injectable } from '@nestjs/common'
import { AUTOCOMPLETE_DEFAULT_LIMIT, DEFAULT_AUTOCOMPLETE_LANGUAGE, DEFAULT_PHOTON_BBOX } from '../constants/autocomplete.constants'
import { PhotonResult } from './types/photon-result.interface'

@Injectable()
export class PhotonProvider implements AutocompleteProvider {
    async search(dto: AutocompleteQueryDto): Promise<AutocompleteResultDto[]> {
        try {
            const response = await axios.get<PhotonResult>('https://photon.komoot.io/api/', {
                headers: {
                    'User-Agent': process.env.AUTOCOMPLETE_USER_AGENT,
                },
                params: {
                    q: dto.q,
                    lang: dto.language ?? DEFAULT_AUTOCOMPLETE_LANGUAGE,
                    limit: dto.limit ?? AUTOCOMPLETE_DEFAULT_LIMIT,
                    bbox: DEFAULT_PHOTON_BBOX,
                },
            })

            return response.data.features.map((f) => ({
                name: f.properties.name,
                address: [
                    f.properties.city,
                    f.properties.street,
                    f.properties.country,
                ]
                    .filter(Boolean)
                    .join(', '),
                lat: f.geometry.coordinates[1],
                lon: f.geometry.coordinates[0],
                source: 'photon',
            }))
        } catch (error) {
            throw new BadGatewayException('Photon provider error');
        }
    }
}