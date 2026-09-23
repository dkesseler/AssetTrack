package com.contoso.workforce.assignment;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface AssignmentRepository extends JpaRepository<Assignment, Long> {
    List<Assignment> findByEmployeeId(Long employeeId);
    List<Assignment> findByAssetId(Long assetId);
    Optional<Assignment> findFirstByAssetIdAndReturnedDateIsNull(Long assetId);
}
