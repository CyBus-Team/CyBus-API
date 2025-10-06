import { NominatimProvider } from './providers/nominatim.provider'
import { PhotonProvider } from './providers/photon.provider'
import { AutocompleteProvider } from './providers/autocomplete-provider.interface'
import { Module } from '@nestjs/common'
import { AutocompleteController } from './autocomplete.controller'
import { AutocompleteService } from './autocomplete.service'
import { AUTOCOMPLETE_PROVIDERS_KEY } from './constants/autocomplete.constants'

@Module({
  controllers: [AutocompleteController],
  providers: [
    NominatimProvider,
    PhotonProvider,
    {
      provide: AUTOCOMPLETE_PROVIDERS_KEY,
      useFactory: (
        nominatim: NominatimProvider,
        photon: PhotonProvider,
      ): AutocompleteProvider[] => [
          nominatim,
          photon,
        ],
      inject: [NominatimProvider, PhotonProvider],
    },
    AutocompleteService,
  ]
})
export class AutocompleteModule { }
