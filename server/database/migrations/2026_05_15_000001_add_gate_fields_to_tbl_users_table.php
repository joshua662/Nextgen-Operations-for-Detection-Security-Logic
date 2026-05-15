<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tbl_users', function (Blueprint $table) {
            $table->enum('role', ['admin', 'resident'])->default('admin')->after('user_id');
            $table->string('contact_number', 20)->nullable()->after('username');
            $table->string('address', 255)->nullable()->after('contact_number');
            $table->string('plate_number', 20)->nullable()->unique()->after('address');
            $table->string('car_model', 55)->nullable()->after('plate_number');
            $table->string('car_color', 55)->nullable()->after('car_model');
        });

        Schema::table('tbl_users', function (Blueprint $table) {
            $table->string('username', 55)->nullable()->change();
            $table->string('password', 255)->nullable()->change();
            $table->unsignedBigInteger('gender_id')->nullable()->change();
            $table->date('birth_date')->nullable()->change();
            $table->integer('age')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('tbl_users', function (Blueprint $table) {
            $table->dropColumn([
                'role',
                'contact_number',
                'address',
                'plate_number',
                'car_model',
                'car_color',
            ]);
        });
    }
};
