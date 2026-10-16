import {
    Controller,
    Get,
    Query,
    UseGuards
} from '@nestjs/common';
import type { User } from '@supabase/supabase-js';
import { CurrentUser } from '../auth/current-user.decorator';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { MonthlyExpensesQueryDto } from './dto/monthly-expenses-query.dto';
import { ExpensesService } from './expenses.service';

@Controller('expenses')
@UseGuards(SupabaseAuthGuard)
export class ExpensesController {
    constructor(private readonly expenses: ExpensesService) {}

    @Get('monthly')
    monthly(@CurrentUser() user: User, @Query() query: MonthlyExpensesQueryDto) {
        return this.expenses.monthly(user.id, query);
    }
}
