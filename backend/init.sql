DO
$$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_database WHERE datname = 'avp_academy'
   ) THEN
      CREATE DATABASE avp_academy;
   END IF;
END
$$;
