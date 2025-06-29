import { Injectable, Inject } from '@nestjs/common'
import { AutocompleteQueryDto } from './dto'
import { AutocompleteProvider } from './providers/autocomplete-provider.interface'

@Injectable()
export class AutocompleteService {
    constructor(
        // Injects all registered autocomplete providers
        @Inject('AUTOCOMPLETE_PROVIDERS')
        private readonly providers: AutocompleteProvider[],
    ) { }

    async search(dto: AutocompleteQueryDto) {
        // Sequentially query each provider with the search DTO
        for (const provider of this.providers) {
            try {
                const result = await provider.search(dto)
                if (result.length > 0) {
                    return dto.limit ? result.slice(0, dto.limit) : result
                }
            } catch (error) {
                console.log(`Provider ${provider.constructor.name} failed: ${error.message}`)
            }
        }
        return []
    }
}