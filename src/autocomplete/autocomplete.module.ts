import { NominatimProvider } from './providers/nominatim.provider'
import { AutocompleteProvider } from './providers/autocomplete-provider.interface'
import { Module } from '@nestjs/common'
import { AutocompleteController } from './autocomplete.controller'
import { AutocompleteService } from './autocomplete.service'

@Module({
  controllers: [AutocompleteController],
  providers: [
    NominatimProvider,
    {
      provide: 'AUTOCOMPLETE_PROVIDERS',
      useFactory: (nominatim: NominatimProvider): AutocompleteProvider[] => [
        nominatim,
      ],
      inject: [NominatimProvider],
    },
    AutocompleteService,
  ]
})
export class AutocompleteModule { }
