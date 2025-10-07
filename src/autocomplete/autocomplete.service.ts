import { Injectable, Inject } from '@nestjs/common'
import { AutocompleteQueryDto } from './dto'
import { AutocompleteProvider } from './providers/autocomplete-provider.interface'
import { AUTOCOMPLETE_PROVIDERS_KEY } from './constants/autocomplete.constants'

@Injectable()
export class AutocompleteService {
    constructor(
        // Injects all registered autocomplete providers implementing the AutocompleteProvider interface
        @Inject(AUTOCOMPLETE_PROVIDERS_KEY)
        private readonly providers: AutocompleteProvider[],
    ) { }

    async search(dto: AutocompleteQueryDto) {
        // Iterate over each autocomplete provider sequentially
        for (const provider of this.providers) {
            console.log(`Trying provider: ${provider.constructor.name}`)
            try {
                // Attempt to retrieve search results from the provider
                const result = await provider.search(dto)

                // If results are found, optionally sort them by proximity to user's coordinates
                if (result.length > 0) {
                    const hasLocation = dto.latitude !== undefined && dto.longitude !== undefined

                    // Sort results by distance from user's location if coordinates are provided
                    if (hasLocation) {
                        result.sort((a, b) => {
                            const dxA = a.lat - dto.latitude!
                            const dyA = a.lon - dto.longitude!
                            const dxB = b.lat - dto.latitude!
                            const dyB = b.lon - dto.longitude!
                            return (dxA * dxA + dyA * dyA) - (dxB * dxB + dyB * dyB)
                        })
                    }

                    // Return limited results if limit is provided, otherwise return all
                    return dto.limit ? result.slice(0, dto.limit) : result
                }
            } catch (error) {
                // Log the error but continue with the next provider
                console.log(`Provider ${provider.constructor.name} failed: ${error.message}`)
            }
        }

        // Return an empty array if no provider returned results
        return []
    }
}