<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE tbl_users MODIFY COLUMN role ENUM('admin', 'security_guard', 'resident') NOT NULL DEFAULT 'admin'");
    }

    public function down(): void
    {
        DB::table('tbl_users')->where('role', 'security_guard')->delete();
        DB::statement("ALTER TABLE tbl_users MODIFY COLUMN role ENUM('admin', 'resident') NOT NULL DEFAULT 'admin'");
    }
};
