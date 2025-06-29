import { Controller, Get, Query } from '@nestjs/common'
import { AutocompleteService } from './autocomplete.service'
import { AutocompleteQueryDto } from './dto'

@Controller('autocomplete')
export class AutocompleteController {
    constructor(private readonly autocompleteService: AutocompleteService) { }

    @Get('search')
    async search(
        @Query() query: AutocompleteQueryDto,
    ) {
        return this.autocompleteService.search(query)
    }
}
