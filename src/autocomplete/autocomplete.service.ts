import { Injectable, Inject } from '@nestjs/common'
import { AutocompleteQueryDto } from './dto'
import { AutocompleteProvider } from './providers/autocomplete-provider.interface'

@Injectable()
export class AutocompleteService {
    constructor(
        @Inject('AUTOCOMPLETE_PROVIDERS')
        private readonly providers: AutocompleteProvider[],
    ) { }

    async search(dto: AutocompleteQueryDto) {
        const results = await Promise.all(
            this.providers.map((provider) => provider.search(dto)),
        )

        const firstNonEmpty = results.find((res) => res.length > 0)
        return firstNonEmpty ?? []
    }
}