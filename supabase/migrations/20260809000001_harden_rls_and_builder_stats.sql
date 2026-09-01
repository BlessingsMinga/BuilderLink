-- BuilderLink Malawi: harden RLS for money/booking data and recalculate builder
-- aggregate ratings so they always reflect submitted (approved) reviews.

-- =============================================================
-- 1. Payments — participants may read; the ledger stays append-only for clients.
--    Status transitions (paid/refunded) are handled server-side by the Edge Function.
-- =============================================================
create policy "customers read own payments"
  on public.payments for select to authenticated
  using (
    customer_id = (select auth.jwt() ->> 'sub')
    or exists (
      select 1 from public.bookings b
      where b.id = payments.booking_id
        and b.builder_id = (select auth.jwt() ->> 'sub')
    )
  );

create policy "customer creates own payment"
  on public.payments for insert to authenticated
  with check (customer_id = (select auth.jwt() ->> 'sub'));

-- =============================================================
-- 2. Booking images — booking participants can read; customer can attach.
-- =============================================================
create policy "booking participants read images"
  on public.booking_images for select to authenticated
  using (exists (
    select 1 from public.bookings b
    where b.id = booking_id
      and (b.customer_id = (select auth.jwt() ->> 'sub')
           or b.builder_id = (select auth.jwt() ->> 'sub'))
  ));

create policy "customer attaches images to own booking"
  on public.booking_images for insert to authenticated
  with check (exists (
    select 1 from public.bookings b
    where b.id = booking_id
      and b.customer_id = (select auth.jwt() ->> 'sub')
  ));

-- =============================================================
-- 3. Bookings — allow participants to update (e.g. accept, complete, cancel).
-- =============================================================
create policy "participants update booking"
  on public.bookings for update to authenticated
  using (
    customer_id = (select auth.jwt() ->> 'sub')
    or builder_id = (select auth.jwt() ->> 'sub')
  )
  with check (
    customer_id = (select auth.jwt() ->> 'sub')
    or builder_id = (select auth.jwt() ->> 'sub')
  );

-- =============================================================
-- 4. Reviews — participants/verified viewers can read; the submitting
--    customer owns their review row (single review per booking via unique key).
-- =============================================================
create policy "read reviews for booking participants"
  on public.reviews for select to authenticated
  using (customer_id = (select auth.jwt() ->> 'sub')
         or exists (
           select 1 from public.builders bk
           where bk.profile_id = (select auth.jwt() ->> 'sub')
             and bk.profile_id = reviews.builder_id
         ));

-- =============================================================
-- 5. Recalculate builder aggregate stats after each new review.
--    average_rating is a 0..5 numeric(3,2); completed_jobs counts approved jobs.
-- =============================================================
create or replace function public.recalculate_builder_stats()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.builders
  set average_rating = (
        select round(avg(overall_rating)::numeric, 2)
        from public.reviews
        where builder_id = new.builder_id
      ),
      completed_jobs = (
        select count(*)::int
        from public.reviews
        where builder_id = new.builder_id
      ),
      updated_at = now()
  where profile_id = new.builder_id;
  return new;
end;
$$;

create trigger recalc_builder_stats_after_review
  after insert on public.reviews
  for each row
  execute function public.recalculate_builder_stats();