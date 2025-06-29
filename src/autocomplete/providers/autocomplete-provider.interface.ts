import { AutocompleteQueryDto, AutocompleteResultDto } from "../dto";

export interface AutocompleteProvider {
    search(dto: AutocompleteQueryDto): Promise<AutocompleteResultDto[]>
}