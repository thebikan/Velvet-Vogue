FROM php:8.4-fpm-bookworm
RUN apt-get update && apt-get install -y --no-install-recommends libonig-dev libxml2-dev unzip git \
    && docker-php-ext-install pdo_mysql mbstring dom xml xmlwriter opcache \
    && pecl install redis && docker-php-ext-enable redis \
    && rm -rf /var/lib/apt/lists/*
COPY --from=composer:2 /usr/bin/composer /usr/local/bin/composer
WORKDIR /app
COPY deploy/php-fpm/production.ini /usr/local/etc/php/conf.d/production.ini
COPY deploy/php-fpm/pool.conf /usr/local/etc/php-fpm.d/zz-velvet.conf
COPY . .
RUN composer install --no-dev --prefer-dist --no-interaction --optimize-autoloader \
    && mkdir -p storage/logs storage/temp && chown -R www-data:www-data storage

ENTRYPOINT ["sh", "/app/deploy/php-fpm/entrypoint.sh"]
CMD ["php-fpm"]
